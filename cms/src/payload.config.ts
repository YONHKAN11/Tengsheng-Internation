import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import fs from 'fs'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Videos } from './collections/Videos'
import { Brands } from './collections/Brands'
import { Vehicles } from './collections/Vehicles'
import { Company } from './globals/Company'
import { VehiclePage } from './globals/VehiclePage'
import { seed } from './seed'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// SQLite only: push the schema when the database file does not exist yet.
// Once it exists, skip push so repeat starts never try to recreate indexes.
const databaseUrl = process.env.DATABASE_URL || ''
const databaseFile = databaseUrl.startsWith('file:') ? databaseUrl.slice('file:'.length) : ''
const databaseExists = databaseFile
  ? fs.existsSync(
      path.isAbsolute(databaseFile) ? databaseFile : path.resolve(process.cwd(), databaseFile),
    )
  : false

const isPostgres = /^postgres(ql)?:\/\//.test(databaseUrl)

const database = isPostgres
  ? postgresAdapter({
      pool: { connectionString: databaseUrl },
      push: process.env.PAYLOAD_PUSH === 'true',
    })
  : sqliteAdapter({
      client: { url: databaseUrl },
      push: databaseFile ? !databaseExists : false,
    })

const s3PublicUrl = (process.env.S3_PUBLIC_URL || '').replace(/\/$/, '')
const s3FileURL = ({ filename, prefix }: { filename: string; prefix?: string }) =>
  `${s3PublicUrl}/${prefix ? `${prefix}/` : ''}${filename}`

const storage = process.env.S3_BUCKET
  ? [
      s3Storage({
        collections: {
          media: { generateFileURL: s3FileURL },
          videos: { generateFileURL: s3FileURL },
        },
        bucket: process.env.S3_BUCKET,
        config: {
          endpoint: process.env.S3_ENDPOINT,
          region: process.env.S3_REGION || 'auto',
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
          },
        },
      }),
    ]
  : []

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Videos, Brands, Vehicles],
  globals: [Company, VehiclePage],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: database,
  sharp,
  onInit: async (payload) => {
    const seeded = await seed(payload)
    if (seeded.length > 0) {
      payload.logger.info(`Seeded: ${seeded.join(', ')}`)
    }
  },
  plugins: storage,
})

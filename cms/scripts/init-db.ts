/**
 * One-time database initialisation for the production image.
 * Run with NODE_ENV=development so Payload is allowed to push the schema.
 * The container entrypoint runs this when PAYLOAD_PUSH=true.
 */

import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const payload = await getPayload({ config: await config })

payload.logger.info('Database schema and seed data are ready')
process.exit(0)

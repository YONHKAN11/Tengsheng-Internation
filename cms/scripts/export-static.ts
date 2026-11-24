/**
 * Manual export (kept for CLI use):
 *   npm run export:static
 *
 * The admin panel now runs this automatically after every save, so this script
 * is only needed when running the export outside the CMS.
 */

import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'
import { exportStatic } from '../src/lib/export-static'

const payload = await getPayload({ config: await config })
const result = await exportStatic(payload)

console.log(`Exported ${result.vehicles} vehicles, ${result.brands} brands → ${result.contentDir}`)
console.log('Next: cd ../site && python build.py')
process.exit(0)

import fs from 'node:fs'
import path from 'node:path'
import type { Payload, PayloadRequest } from 'payload'

/**
 * Seeds the CMS on first boot:
 *  - one administrator account (credentials from ADMIN_EMAIL / ADMIN_PASSWORD)
 *  - brands, company content and vehicle inventory taken from ../site/content
 *
 * The import is idempotent: existing records are never overwritten.
 */

const SITE_CONTENT = path.resolve(process.cwd(), '..', 'site', 'content')

function readContent<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(SITE_CONTENT, file), 'utf8')) as T
  } catch {
    return null
  }
}

const BRANDS = [
  { name: 'Toyota', origin: 'Japan', description: 'Full-size SUVs, pickups and hybrids with global parts coverage.', featured: true },
  { name: 'Lexus', origin: 'Japan', description: 'Premium SUVs and sedans on proven Toyota platforms.', featured: false },
  { name: 'Nissan', origin: 'Japan', description: 'Patrol and pickups with strong Gulf and African demand.', featured: false },
  { name: 'BMW', origin: 'Germany', description: 'European premium SUVs and sedans, left-hand drive.', featured: true },
  { name: 'Mercedes-Benz', origin: 'Germany', description: 'Executive SUVs and sedans with strong resale value.', featured: true },
  { name: 'Audi', origin: 'Germany', description: 'quattro all-wheel-drive SUVs with advanced technology.', featured: false },
  { name: 'Volkswagen', origin: 'Germany', description: 'Discreet premium SUVs and value-focused passenger cars.', featured: false },
  { name: 'Tesla', origin: 'USA', description: 'Long-range electric vehicles with global charging access.', featured: true },
  { name: 'Ford', origin: 'USA', description: 'Pickups and performance trucks built for rough roads.', featured: false },
  { name: 'Hyundai', origin: 'South Korea', description: 'Well-equipped SUVs and hybrids with strong warranties.', featured: false },
]

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tengsheng.local'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Tengsheng-Admin-2026'

const VEHICLE_PAGE = {
  pendingLabel: 'Media pending',
  mediaNote:
    'Photos and video for this vehicle are uploaded by our team in the admin panel. Request the latest media pack with your quotation.',
  priceLabel: 'Indicative FOB',
  priceNote:
    'Indicative price, excluding freight and destination charges unless quoted. Condition report, extra photographs and document summary provided before payment.',
  aboutTitle: 'About this vehicle',
  specsTitle: 'Specifications',
  featuresTitle: 'Equipment & features',
  termsTitle: 'Export terms',
  terms: [
    { label: 'Terms', value: 'FOB / CFR / CIF / DAP' },
    { label: 'Shipping', value: 'Ro-ro or container' },
    { label: 'Documents', value: 'Full export set' },
    { label: 'Inspection', value: 'Report before payment' },
  ],
  whatsappLabel: 'Inquire on WhatsApp',
  emailLabel: 'Email an inquiry',
  processLinkLabel: 'See the export process →',
  sourcingTitle: 'Need a different specification?',
  sourcingText:
    'We source to order: other trims, colours, quantities and model years are available through our dealer network.',
  sourcingLinkLabel: 'Send a sourcing request →',
  relatedEyebrow: 'More inventory',
  relatedTitle: 'You may also consider',
}

export async function seed(payload: Payload): Promise<string[]> {
  const seeded: string[] = []

  // 1. Administrator
  try {
    const users = await payload.count({ collection: 'users' })
    if (users.totalDocs === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          name: 'Site Administrator',
        } as never,
      })
      seeded.push('admin user')
    }
  } catch (error) {
    payload.logger.error({ msg: 'Could not create the admin user', err: error })
  }

  // 2. Brands
  try {
    const brandCount = await payload.count({ collection: 'brands' })
    if (brandCount.totalDocs === 0) {
      for (const brand of BRANDS) {
        await payload.create({ collection: 'brands', data: brand as never })
      }
      seeded.push('brands')
    }
  } catch (error) {
    payload.logger.error({ msg: 'Could not seed brands', err: error })
  }

  // 3. Company content and contact details
  try {
    const company = await payload.findGlobal({ slug: 'company' })
    if (!company?.name) {
      const site = readContent<any>('site.json')
      if (site) {
        await payload.updateGlobal({
          slug: 'company',
          data: {
            name: site.name,
            tagline: site.tagline,
            heroTitle: site.hero?.title,
            heroSubtitle: site.hero?.subtitle,
            aboutTitle: site.about?.title,
            about: [site.about?.lead, ...(site.about?.paragraphs ?? [])].filter(Boolean).join('\n\n'),
            missionTitle: site.about?.principlesTitle,
            mission: (site.about?.principles ?? []).map((p: any) => `${p.title}: ${p.description}`).join('\n\n'),
            strengths: (site.strengths?.items ?? []).map((s: any) => ({ title: s.title, description: s.description })),
            stats: site.stats ?? [],
            processSteps: (site.process?.steps ?? []).map((s: any) => ({ title: s.title, description: s.description })),
            contact: {
              email: site.contact?.email,
              phone: site.contact?.whatsapp,
              whatsapp: site.contact?.whatsapp,
              hours: site.contact?.response,
              address: '',
            },
          } as never,
        })
        seeded.push('company')
      }
    }
  } catch (error) {
    payload.logger.error({ msg: 'Could not seed company content', err: error })
  }

  // 4. Vehicles (without media — photos and videos are uploaded in the admin panel)
  try {
    const vehicleCount = await payload.count({ collection: 'vehicles' })
    if (vehicleCount.totalDocs === 0) {
      const content = readContent<any>('vehicles.json')
      if (content?.vehicles?.length) {
        const brands = await payload.find({ collection: 'brands', limit: 100 })
        const byName = new Map(brands.docs.map((brand: any) => [String(brand.name).toLowerCase(), brand.id]))

        for (const vehicle of content.vehicles) {
          await payload.create({
            collection: 'vehicles',
            data: {
              title: vehicle.name,
              slug: vehicle.slug,
              brand: byName.get(String(vehicle.brand).toLowerCase()),
              model: vehicle.model,
              trim: vehicle.trim,
              year: Number(vehicle.year),
              condition: String(vehicle.condition).toLowerCase() === 'used' ? 'used' : 'new',
              price: Number(String(vehicle.price).replace(/[^0-9.]/g, '')) || 0,
              currency: 'USD',
              mileage: vehicle.mileage,
              description: vehicle.description,
              featured: Boolean(vehicle.featured),
              status: 'available',
              bodyType: vehicle.bodyType,
              fuel: vehicle.fuel,
              engine: vehicle.engine,
              power: vehicle.power,
              torque: vehicle.torque,
              transmission: vehicle.transmission,
              drivetrain: vehicle.drivetrain,
              seats: vehicle.seats ? Number(vehicle.seats) : undefined,
              exterior: vehicle.exterior,
              interior: vehicle.interior,
              steering: vehicle.steering,
              emissions: vehicle.emissions,
              stock: vehicle.stock,
              port: vehicle.port,
              features: (vehicle.features ?? []).map((item: string) => ({ item })),
            } as never,
          })
        }
        seeded.push(`${content.vehicles.length} vehicles`)
      }
    }
  } catch (error) {
    payload.logger.error({ msg: 'Could not seed vehicles', err: error })
  }

  // 5. Vehicle detail page copy
  try {
    const vehiclePage = await payload.findGlobal({ slug: 'vehicle-page' })
    if (!vehiclePage?.aboutTitle) {
      await payload.updateGlobal({ slug: 'vehicle-page', data: VEHICLE_PAGE as never })
      seeded.push('vehicle page')
    }
  } catch (error) {
    payload.logger.error({ msg: 'Could not seed vehicle page copy', err: error })
  }

  return seeded
}

/**
 * Export the CMS content and media to the static showcase.
 *
 *   npm run export:static
 *
 * - copies uploaded photos and videos into ../site/assets
 * - writes ../site/content/media.json (per-vehicle galleries)
 * - rewrites ../site/content/vehicles.json from the Vehicles collection
 * - syncs company name, tagline and contact details into site.json
 *
 * Then rebuild the site with `python build.py` inside ../site.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

const cmsDir = process.cwd()
const siteDir = path.resolve(process.env.SITE_DIR || path.join(cmsDir, '..', 'site'))
const photoDir = path.join(siteDir, 'assets', 'img', 'uploads')
const brandDir = path.join(siteDir, 'assets', 'img', 'brands')
const videoDir = path.join(siteDir, 'assets', 'video')
const contentDir = path.join(siteDir, 'content')

type MediaDoc = {
  filename?: string | null
  alt?: string | null
  sizes?: Record<string, { filename?: string | null }>
  poster?: MediaDoc | string | null
}

type VehicleDoc = {
  slug: string
  title: string
  brand?: { name?: string } | string | null
  model?: string | null
  trim?: string | null
  year?: number | null
  condition?: string | null
  price?: number | null
  currency?: string | null
  mileage?: string | null
  description?: string | null
  featured?: boolean | null
  status?: string | null
  bodyType?: string | null
  fuel?: string | null
  engine?: string | null
  power?: string | null
  torque?: string | null
  transmission?: string | null
  drivetrain?: string | null
  seats?: number | null
  exterior?: string | null
  interior?: string | null
  steering?: string | null
  emissions?: string | null
  stock?: string | null
  port?: string | null
  features?: { item?: string | null }[] | null
  images?: (MediaDoc | string)[] | null
  videos?: (MediaDoc | string)[] | null
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(contentDir, file), 'utf8')) as T
  } catch {
    return null
  }
}

async function copyFile(source: string, target: string): Promise<boolean> {
  try {
    await fs.access(source)
  } catch {
    return false
  }
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.copyFile(source, target)
  return true
}

function formatPrice(value: number | null | undefined, currency: string): string {
  const amount = Number(value) || 0
  return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`
}

function slugify(value: string): string {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function copyBrandImage(
  image: MediaDoc | string | null | undefined,
  size?: 'wide' | 'card' | 'thumb',
): Promise<string> {
  if (!image || typeof image === 'string') return ''
  const sized = size ? image.sizes?.[size]?.filename : undefined
  const filename = sized || image.filename
  if (!filename) return ''
  const copied = await copyFile(path.join(cmsDir, 'media', filename), path.join(brandDir, filename))
  return copied ? `assets/img/brands/${filename}` : ''
}

function titleCase(value: string | null | undefined): string {
  const text = String(value || 'new')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export type ExportResult = {
  vehicles: number
  brands: number
  photos: number
  videos: number
  skipped: number
  contentDir: string
}

export async function exportStatic(payload: Payload): Promise<ExportResult> {

  const vehicles = await payload.find({
    collection: 'vehicles',
    depth: 2,
    limit: 500,
    sort: 'createdAt',
  })

  const mediaMap: Record<string, { images: { src: string; alt: string }[]; videos: { src: string; poster: string }[] }> = {}
  const exportedVehicles: Record<string, unknown>[] = []
  let photoCount = 0
  let videoCount = 0
  let skipped = 0

  for (const doc of vehicles.docs as unknown as VehicleDoc[]) {
    const images: { src: string; alt: string }[] = []
    for (const entry of doc.images ?? []) {
      if (!entry || typeof entry === 'string') continue
      const filename = entry.filename
      if (!filename) continue
      const copied = await copyFile(path.join(cmsDir, 'media', filename), path.join(photoDir, filename))
      if (!copied) {
        skipped += 1
        continue
      }
      images.push({ src: `assets/img/uploads/${filename}`, alt: entry.alt || doc.title })
      photoCount += 1
    }

    const videos: { src: string; poster: string }[] = []
    for (const entry of doc.videos ?? []) {
      if (!entry || typeof entry === 'string') continue
      const filename = entry.filename
      if (!filename) continue
      const copied = await copyFile(path.join(cmsDir, 'videos', filename), path.join(videoDir, filename))
      if (!copied) {
        skipped += 1
        continue
      }

      let poster = ''
      const posterDoc = entry.poster && typeof entry.poster === 'object' ? entry.poster : null
      if (posterDoc?.filename) {
        const posterName = posterDoc.sizes?.wide?.filename || posterDoc.sizes?.card?.filename || posterDoc.filename
        if (posterName && (await copyFile(path.join(cmsDir, 'media', posterName), path.join(photoDir, posterName)))) {
          poster = `assets/img/uploads/${posterName}`
        }
      }

      videos.push({ src: `assets/video/${filename}`, poster })
      videoCount += 1
    }

    mediaMap[doc.slug] = { images, videos }

    const brandName = doc.brand && typeof doc.brand === 'object' ? doc.brand.name || '' : ''
    const isUsed = String(doc.condition || '').toLowerCase() === 'used'

    exportedVehicles.push({
      slug: doc.slug,
      name: doc.title,
      brand: brandName,
      model: doc.model || '',
      trim: doc.trim || '',
      year: doc.year || new Date().getFullYear(),
      condition: isUsed ? 'Used' : 'New',
      price: formatPrice(doc.price, doc.currency || 'USD'),
      bodyType: doc.bodyType || 'SUV',
      fuel: doc.fuel || 'Petrol',
      engine: doc.engine || '',
      power: doc.power || '',
      torque: doc.torque || '',
      transmission: doc.transmission || '',
      drivetrain: doc.drivetrain || '',
      seats: doc.seats || 5,
      mileage: doc.mileage || '',
      exterior: doc.exterior || '',
      interior: doc.interior || '',
      steering: doc.steering || 'Left-hand drive',
      emissions: doc.emissions || '',
      stock: doc.stock || '',
      port: doc.port || '',
      featured: Boolean(doc.featured),
      status: titleCase(doc.status),
      description: doc.description || '',
      features: (doc.features ?? []).map((feature) => feature.item).filter(Boolean),
      images: [],
      videos: [],
    })
  }

  const previous = await readJson<{ note?: string }>('vehicles.json')
  await fs.mkdir(contentDir, { recursive: true })
  await fs.writeFile(
    path.join(contentDir, 'media.json'),
    `${JSON.stringify(mediaMap, null, 2)}\n`,
    'utf8',
  )
  await fs.writeFile(
    path.join(contentDir, 'vehicles.json'),
    `${JSON.stringify(
      {
        note:
          previous?.note ||
          'Indicative FOB prices for export. Final quotation depends on specification, destination port, Incoterms and shipping schedule.',
        vehicles: exportedVehicles,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  const brandDocs = await payload.find({ collection: 'brands', depth: 2, limit: 500, sort: 'sortOrder' })
  const exportedBrands: Record<string, unknown>[] = []
  for (const brand of brandDocs.docs as any[]) {
    const logo = await copyBrandImage(brand.logo)
    const cover = await copyBrandImage(brand.cover, 'wide')
    const vehicleCount = exportedVehicles.filter(
      (vehicle) => String(vehicle.brand).toLowerCase() === String(brand.name).toLowerCase(),
    ).length

    exportedBrands.push({
      slug: brand.slug || slugify(brand.name),
      name: brand.name,
      origin: brand.origin || '',
      description: brand.description || '',
      website: brand.website || '',
      featured: Boolean(brand.featured),
      sortOrder: brand.sortOrder ?? 100,
      logo,
      cover,
      vehicleCount,
    })
  }

  await fs.writeFile(
    path.join(contentDir, 'brands.json'),
    `${JSON.stringify({ brands: exportedBrands }, null, 2)}\n`,
    'utf8',
  )

  const company = await payload.findGlobal({ slug: 'company' })
  const site = await readJson<Record<string, any>>('site.json')
  if (site && company) {
    site.name = company.name || site.name
    site.tagline = company.tagline || site.tagline
    if (company.contact?.email) site.contact.email = company.contact.email
    if (company.contact?.whatsapp) {
      site.contact.whatsapp = company.contact.whatsapp
      site.contact.whatsappNumber = String(company.contact.whatsapp).replace(/[^0-9]/g, '')
    }
    if (company.heroTitle) site.hero.title = company.heroTitle
    if (company.heroSubtitle) site.hero.subtitle = company.heroSubtitle
    await fs.writeFile(path.join(contentDir, 'site.json'), `${JSON.stringify(site, null, 2)}\n`, 'utf8')
  }

  const vehiclePage = await payload.findGlobal({ slug: 'vehicle-page' })
  if (vehiclePage) {
    await fs.writeFile(
      path.join(contentDir, 'vehicle-page.json'),
      `${JSON.stringify(vehiclePage, null, 2)}\n`,
      'utf8',
    )
  }

  const result: ExportResult = {
    vehicles: exportedVehicles.length,
    brands: exportedBrands.length,
    photos: photoCount,
    videos: videoCount,
    skipped,
    contentDir,
  }

  console.log(`Exported ${result.vehicles} vehicles, ${result.brands} brands → ${path.relative(cmsDir, contentDir)}`)
  console.log(`Photos: ${result.photos}, videos: ${result.videos}${skipped ? `, skipped ${skipped} missing file(s)` : ''}`)

  return result
}

#!/usr/bin/env node
/**
 * Pull content from the deployed Payload CMS into the static site.
 *
 * Used by Cloudflare Pages at build time:
 *   CMS_URL=https://your-cms.up.railway.app node tools/fetch-content.mjs
 *   python build.py
 *
 * Media is referenced by its public URL (Cloudflare R2), not downloaded.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = path.join(siteDir, 'content')
const CMS_URL = (process.env.CMS_URL || 'http://localhost:3000').replace(/\/$/, '')

async function api(endpoint) {
  const url = `${CMS_URL}/api${endpoint}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`GET ${url} failed with ${response.status}`)
  return response.json()
}

function absolute(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  return `${CMS_URL}${url}`
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formatPrice(vehicle) {
  const amount = Number(vehicle.price) || 0
  const currency = vehicle.currency || 'USD'
  return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`
}

function titleCase(value, fallback) {
  const text = String(value || fallback)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(contentDir, file), 'utf8'))
  } catch {
    return fallback
  }
}

async function main() {
  const [vehiclesResponse, brandsResponse, vehiclePage, company] = await Promise.all([
    api('/vehicles?depth=2&limit=500&sort=createdAt'),
    api('/brands?depth=2&limit=500&sort=sortOrder'),
    api('/globals/vehicle-page'),
    api('/globals/company'),
  ])

  const vehicles = vehiclesResponse.docs.map((vehicle) => ({
    slug: vehicle.slug,
    name: vehicle.title,
    brand: typeof vehicle.brand === 'object' ? vehicle.brand?.name || '' : '',
    model: vehicle.model || '',
    trim: vehicle.trim || '',
    year: vehicle.year || new Date().getFullYear(),
    condition: String(vehicle.condition || '').toLowerCase() === 'used' ? 'Used' : 'New',
    price: formatPrice(vehicle),
    bodyType: vehicle.bodyType || 'SUV',
    fuel: vehicle.fuel || 'Petrol',
    engine: vehicle.engine || '',
    power: vehicle.power || '',
    torque: vehicle.torque || '',
    transmission: vehicle.transmission || '',
    drivetrain: vehicle.drivetrain || '',
    seats: vehicle.seats || 5,
    mileage: vehicle.mileage || '',
    exterior: vehicle.exterior || '',
    interior: vehicle.interior || '',
    steering: vehicle.steering || 'Left-hand drive',
    emissions: vehicle.emissions || '',
    stock: vehicle.stock || '',
    port: vehicle.port || '',
    featured: Boolean(vehicle.featured),
    status: titleCase(vehicle.status, 'Available'),
    description: vehicle.description || '',
    features: (vehicle.features || []).map((feature) => feature.item).filter(Boolean),
    images: [],
    videos: [],
  }))

  const media = {}
  for (const vehicle of vehiclesResponse.docs) {
    media[vehicle.slug] = {
      images: (vehicle.images || [])
        .filter((image) => image && typeof image === 'object' && image.url)
        .map((image) => ({ src: absolute(image.url), alt: image.alt || vehicle.title })),
      videos: (vehicle.videos || [])
        .filter((video) => video && typeof video === 'object' && video.url)
        .map((video) => ({
          src: absolute(video.url),
          poster:
            video.poster && typeof video.poster === 'object' ? absolute(video.poster.url) : '',
        })),
    }
  }

  const brands = brandsResponse.docs.map((brand) => ({
    slug: brand.slug || slugify(brand.name),
    name: brand.name,
    origin: brand.origin || '',
    description: brand.description || '',
    website: brand.website || '',
    featured: Boolean(brand.featured),
    sortOrder: brand.sortOrder ?? 100,
    logo: brand.logo && typeof brand.logo === 'object' ? absolute(brand.logo.url) : '',
    cover: brand.cover && typeof brand.cover === 'object' ? absolute(brand.cover.url) : '',
    vehicleCount: vehicles.filter(
      (vehicle) => vehicle.brand.toLowerCase() === String(brand.name).toLowerCase(),
    ).length,
  }))

  const previousVehicles = await readJson('vehicles.json', { note: '' })
  const page = { ...vehiclePage }
  delete page.id
  delete page.createdAt
  delete page.updatedAt

  await fs.mkdir(contentDir, { recursive: true })
  await fs.writeFile(
    path.join(contentDir, 'vehicles.json'),
    `${JSON.stringify(
      {
        note:
          previousVehicles.note ||
          'Indicative FOB prices for export. Final quotation depends on specification, destination port, Incoterms and shipping schedule.',
        vehicles,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  await fs.writeFile(
    path.join(contentDir, 'media.json'),
    `${JSON.stringify(media, null, 2)}\n`,
    'utf8',
  )
  await fs.writeFile(
    path.join(contentDir, 'brands.json'),
    `${JSON.stringify({ brands }, null, 2)}\n`,
    'utf8',
  )
  await fs.writeFile(
    path.join(contentDir, 'vehicle-page.json'),
    `${JSON.stringify(page, null, 2)}\n`,
    'utf8',
  )

  const site = await readJson('site.json', null)
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
    await fs.writeFile(
      path.join(contentDir, 'site.json'),
      `${JSON.stringify(site, null, 2)}\n`,
      'utf8',
    )
  }

  console.log(
    `Fetched ${vehicles.length} vehicles, ${brands.length} brands from ${CMS_URL} → ${contentDir}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

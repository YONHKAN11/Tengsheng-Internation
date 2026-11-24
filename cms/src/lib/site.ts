import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Brand, Company } from '@/payload-types'

export async function getCompany(): Promise<Company | null> {
  const payload = await getPayload({ config: configPromise })
  try {
    return await payload.findGlobal({ slug: 'company' })
  } catch {
    return null
  }
}

export async function getBrands(featuredOnly = false): Promise<Brand[]> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'brands',
    sort: 'name',
    limit: 100,
    ...(featuredOnly ? { where: { featured: { equals: true } } } : {}),
  })
  return result.docs
}

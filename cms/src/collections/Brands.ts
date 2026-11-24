import type { CollectionConfig } from 'payload'

import { scheduleStaticSync } from '../lib/auto-sync'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Brands are fully editable: name, country, description, logo, cover, website,
 * ordering and visibility. Deleting a brand also deletes the vehicles attached
 * to it (see the cascade hook below), so the admin can remove any brand and its
 * inventory in one action.
 */
export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: {
    singular: 'Brand',
    plural: 'Brands',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'origin', 'featured', 'sortOrder', 'updatedAt'],
    group: 'Inventory',
    description: 'Create, edit or delete any brand. Deleting a brand also deletes its vehicles.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.name) {
          data.slug = slugify(String(data.name))
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        if (!id) return
        // Cascade: remove every vehicle that belongs to this brand.
        for (;;) {
          const batch = await req.payload.find({
            collection: 'vehicles',
            where: { brand: { equals: id } },
            limit: 100,
            depth: 0,
            req,
          })
          if (!batch.docs.length) break
          for (const vehicle of batch.docs) {
            await req.payload.delete({ collection: 'vehicles', id: vehicle.id, req })
          }
          if (batch.docs.length < 100) break
        }
      },
    ],
    afterChange: [
      ({ req }) => {
        scheduleStaticSync(req.payload)
      },
    ],
    afterDelete: [
      ({ req }) => {
        scheduleStaticSync(req.payload)
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Used in the brand page URL. Generated from the name if left blank.',
      },
    },
    {
      name: 'origin',
      type: 'text',
      admin: {
        description: 'Country of origin, e.g. Germany, Japan, South Korea.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Shown on the brand page and the homepage brand strip.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Square or horizontal brand mark. Upload it under Photos first.',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional wide image used as the brand page banner.',
      },
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Optional official website, e.g. https://www.toyota.com.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes — not published on the website.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Highlight this brand on the homepage.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 100,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first in brand lists.',
      },
    },
    {
      name: 'vehicles',
      type: 'join',
      collection: 'vehicles',
      on: 'brand',
      admin: {
        description: 'Vehicles currently attached to this brand. Open a vehicle to edit its price or specification.',
        defaultColumns: ['title', 'year', 'condition', 'price', 'status'],
      },
    },
  ],
}

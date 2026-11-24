import type { CollectionConfig } from 'payload'

import { scheduleStaticSync } from '../lib/auto-sync'

/**
 * Vehicle photography. Admins upload here, then attach images to a vehicle.
 * Files are stored in ./media (relative to the CMS project).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Photo',
    plural: 'Photos',
  },
  access: {
    read: () => true,
  },
  hooks: {
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
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'filename', 'filesize', 'updatedAt'],
    group: 'Media',
    description: 'Vehicle photos. JPG or WebP, around 1600 px wide, under 400 KB each.',
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'card', width: 800, height: 600, position: 'centre' },
      { name: 'wide', width: 1600, height: 1000, position: 'centre' },
      { name: 'thumb', width: 480, height: 360, position: 'centre' },
    ],
    adminThumbnail: 'thumb',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Describe the photo for accessibility and SEO, e.g. “2025 Land Cruiser 300, front three-quarter view”.',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: 'Photographer, dealer or supplier credit, if required.',
      },
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      admin: {
        position: 'sidebar',
        description: 'Optional: file this photo under a brand, so it is easy to find when editing that brand.',
      },
    },
  ],
}

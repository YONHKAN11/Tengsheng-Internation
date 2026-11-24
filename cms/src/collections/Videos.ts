import type { CollectionConfig } from 'payload'

import { scheduleStaticSync } from '../lib/auto-sync'

/**
 * Vehicle walkaround and inspection videos. MP4 (H.264) recommended.
 * Files are stored in ./videos (relative to the CMS project).
 */
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: {
    singular: 'Video',
    plural: 'Videos',
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
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'filesize', 'updatedAt'],
    group: 'Media',
    description: 'Vehicle walkarounds. MP4 (H.264), 1080p, under 50 MB each.',
  },
  upload: {
    staticDir: 'videos',
    mimeTypes: ['video/*'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Short label shown in the gallery, e.g. “Walkaround”.',
      },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional still image shown before the video plays.',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      admin: {
        position: 'sidebar',
        description: 'Optional: file this video under a brand.',
      },
    },
  ],
}

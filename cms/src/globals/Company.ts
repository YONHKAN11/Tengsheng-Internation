import type { GlobalConfig } from 'payload'

import { scheduleStaticSync } from '../lib/auto-sync'

export const Company: GlobalConfig = {
  slug: 'company',
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      ({ req }) => {
        scheduleStaticSync(req.payload)
      },
    ],
  },
  admin: {
    group: 'Site Content',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Branding',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'tagline',
              type: 'text',
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        {
          label: 'Homepage',
          fields: [
            {
              name: 'heroTitle',
              type: 'text',
            },
            {
              name: 'heroSubtitle',
              type: 'textarea',
            },
          ],
        },
        {
          label: 'About',
          fields: [
            {
              name: 'aboutTitle',
              type: 'text',
            },
            {
              name: 'about',
              type: 'textarea',
            },
            {
              name: 'missionTitle',
              type: 'text',
            },
            {
              name: 'mission',
              type: 'textarea',
            },
            {
              name: 'strengths',
              type: 'array',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
              ],
            },
            {
              name: 'stats',
              type: 'array',
              fields: [
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Process',
          fields: [
            {
              name: 'processSteps',
              type: 'array',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
              ],
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'contact',
              type: 'group',
              fields: [
                {
                  name: 'email',
                  type: 'email',
                },
                {
                  name: 'phone',
                  type: 'text',
                },
                {
                  name: 'whatsapp',
                  type: 'text',
                },
                {
                  name: 'address',
                  type: 'textarea',
                },
                {
                  name: 'hours',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

import type { GlobalConfig } from 'payload'

import { scheduleStaticSync } from '../lib/auto-sync'

/**
 * Copy shown on every vehicle detail page. Everything here is editable in the
 * admin panel under Site Content → Vehicle page, without touching code.
 */
export const VehiclePage: GlobalConfig = {
  slug: 'vehicle-page',
  label: 'Vehicle page',
  admin: {
    group: 'Site Content',
    description: 'Text and labels shown on every vehicle detail page.',
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
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Media & price',
          fields: [
            {
              name: 'pendingLabel',
              type: 'text',
              defaultValue: 'Media pending',
              admin: { description: 'Small badge shown when a vehicle has no photos yet.' },
            },
            {
              name: 'mediaNote',
              type: 'textarea',
              defaultValue:
                'Photos and video for this vehicle are uploaded by our team in the admin panel. Request the latest media pack with your quotation.',
              admin: { description: 'Shown under the gallery until photos or video are attached.' },
            },
            {
              name: 'priceLabel',
              type: 'text',
              defaultValue: 'Indicative FOB',
            },
            {
              name: 'priceNote',
              type: 'textarea',
              defaultValue:
                'Indicative price, excluding freight and destination charges unless quoted. Condition report, extra photographs and document summary provided before payment.',
            },
          ],
        },
        {
          label: 'Section titles',
          fields: [
            { name: 'aboutTitle', type: 'text', defaultValue: 'About this vehicle' },
            { name: 'specsTitle', type: 'text', defaultValue: 'Specifications' },
            { name: 'featuresTitle', type: 'text', defaultValue: 'Equipment & features' },
            { name: 'termsTitle', type: 'text', defaultValue: 'Export terms' },
          ],
        },
        {
          label: 'Export terms',
          fields: [
            {
              name: 'terms',
              type: 'array',
              labels: { singular: 'Term', plural: 'Terms' },
              admin: { description: 'Rows shown in the “Export terms” panel of every vehicle.' },
              defaultValue: [
                { label: 'Terms', value: 'FOB / CFR / CIF / DAP' },
                { label: 'Shipping', value: 'Ro-ro or container' },
                { label: 'Documents', value: 'Full export set' },
                { label: 'Inspection', value: 'Report before payment' },
              ],
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'value', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          label: 'Inquiry & sourcing',
          fields: [
            { name: 'whatsappLabel', type: 'text', defaultValue: 'Inquire on WhatsApp' },
            { name: 'emailLabel', type: 'text', defaultValue: 'Email an inquiry' },
            { name: 'processLinkLabel', type: 'text', defaultValue: 'See the export process →' },
            { name: 'sourcingTitle', type: 'text', defaultValue: 'Need a different specification?' },
            {
              name: 'sourcingText',
              type: 'textarea',
              defaultValue:
                'We source to order: other trims, colours, quantities and model years are available through our dealer network.',
            },
            { name: 'sourcingLinkLabel', type: 'text', defaultValue: 'Send a sourcing request →' },
            { name: 'relatedEyebrow', type: 'text', defaultValue: 'More inventory' },
            { name: 'relatedTitle', type: 'text', defaultValue: 'You may also consider' },
          ],
        },
      ],
    },
  ],
}

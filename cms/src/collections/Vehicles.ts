import type { CollectionConfig } from 'payload'

import { scheduleStaticSync } from '../lib/auto-sync'

/**
 * Vehicle inventory. One document per export unit; media is attached from the
 * Photos and Videos collections. The static showcase is generated from here by
 * `npm run export:static`.
 */
export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  labels: {
    singular: 'Vehicle',
    plural: 'Vehicles',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'condition', 'status', 'price', 'featured'],
    group: 'Inventory',
    description: 'Export units shown on the website. Attach photos and videos, then run “Export to static site”.',
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
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              admin: { description: 'Public listing name, e.g. “Toyota Land Cruiser 300 VX-R”.' },
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: {
                position: 'sidebar',
                description: 'URL name, e.g. “toyota-land-cruiser-300-vx-r”. Lowercase, hyphens only.',
              },
              hooks: {
                beforeValidate: [
                  ({ value, data }) => {
                    if (value) return String(value).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
                    if (data?.title) {
                      return String(data.title).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
                    }
                    return value
                  },
                ],
              },
            },
            {
              name: 'brand',
              type: 'relationship',
              relationTo: 'brands',
              required: true,
            },
            {
              name: 'model',
              type: 'text',
            },
            {
              name: 'trim',
              type: 'text',
            },
            {
              type: 'row',
              fields: [
                { name: 'year', type: 'number', required: true, admin: { width: '50%' } },
                {
                  name: 'condition',
                  type: 'select',
                  required: true,
                  defaultValue: 'new',
                  options: [
                    { label: 'New', value: 'new' },
                    { label: 'Used', value: 'used' },
                  ],
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  type: 'number',
                  required: true,
                  admin: { width: '34%', description: 'Indicative FOB price in USD.' },
                },
                {
                  name: 'currency',
                  type: 'text',
                  defaultValue: 'USD',
                  admin: { width: '16%' },
                },
                {
                  name: 'mileage',
                  type: 'text',
                  admin: { width: '50%', description: 'e.g. “Delivery mileage” or “28,500 km”.' },
                },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              admin: { description: '2–4 sentences shown on the vehicle page.' },
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              admin: { position: 'sidebar', description: 'Show on the homepage.' },
            },
            {
              name: 'status',
              type: 'select',
              defaultValue: 'available',
              options: [
                { label: 'Available', value: 'available' },
                { label: 'Reserved', value: 'reserved' },
                { label: 'Sold', value: 'sold' },
              ],
              admin: { position: 'sidebar' },
            },
          ],
        },
        {
          label: 'Specifications',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'bodyType',
                  type: 'select',
                  required: true,
                  options: ['SUV', 'Pickup', 'Sedan', 'MPV', 'Van', 'Coupe', 'Other'].map((v) => ({ label: v, value: v })),
                  admin: { width: '50%' },
                },
                {
                  name: 'fuel',
                  type: 'select',
                  required: true,
                  options: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in hybrid', 'LPG'].map((v) => ({ label: v, value: v })),
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'engine', type: 'text', admin: { width: '50%' } },
                { name: 'power', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'torque', type: 'text', admin: { width: '50%' } },
                { name: 'transmission', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'drivetrain', type: 'text', admin: { width: '50%' } },
                { name: 'seats', type: 'number', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'exterior', type: 'text', admin: { width: '50%' } },
                { name: 'interior', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'steering', type: 'text', defaultValue: 'Left-hand drive', admin: { width: '50%' } },
                { name: 'emissions', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'stock', type: 'text', admin: { width: '50%', description: 'Stock location, e.g. Dubai, UAE.' } },
                { name: 'port', type: 'text', admin: { width: '50%', description: 'Loading port.' } },
              ],
            },
            {
              name: 'features',
              type: 'array',
              labels: { singular: 'Feature', plural: 'Features' },
              fields: [{ name: 'item', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Photos & video',
          fields: [
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: { description: 'Upload photos in the Photos collection first, then select them here. The first photo is the cover.' },
            },
            {
              name: 'videos',
              type: 'upload',
              relationTo: 'videos',
              hasMany: true,
              admin: { description: 'Upload walkaround videos in the Videos collection, then select them here.' },
            },
          ],
        },
      ],
    },
  ],
}

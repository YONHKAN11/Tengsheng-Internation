import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Admin user',
    plural: 'Admin users',
  },
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
    description: 'Accounts that can sign in to the admin panel.',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: { description: 'Shown in the admin panel and on activity logs.' },
    },
  ],
}

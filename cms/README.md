# Tengsheng CMS (Payload)

Content backend for the Tengsheng International vehicle export showcase.
It runs **locally** or on your own server; the public site is the static build in `../site/dist`.

Full setup, credentials and deployment notes: see [`../README.md`](../README.md).

## Quick start

```bash
npm ci
npm run dev          # http://localhost:3000/admin
```

Initial administrator (created on first boot from `.env`):

```
admin@tengsheng.local
Tengsheng-Admin-2026
```

Change the password after the first login.

## Collections

| Collection | Purpose |
| --- | --- |
| `vehicles` | Export units: price, specification, description, photos, videos |
| `media` (Photos) | Image uploads, with 800×600 / 1600×1000 / 480×360 derivatives |
| `videos` | MP4 walkarounds, optional poster frame |
| `brands` | Manufacturer list used by vehicles and the homepage |
| `users` | Admin accounts |
| `company` (Global) | Company name, tagline, about copy, stats, process and contact details |

## Publish to the static site

```bash
npm run export:static       # copies media + rewrites ../site/content
cd ../site && python build.py
```

Then upload `../site/dist`.

## Environment

Copy `.env.example` to `.env` and adjust:

```
DATABASE_URL=file:./tengsheng.db
PAYLOAD_SECRET=<long random string>
ADMIN_EMAIL=admin@tengsheng.local
ADMIN_PASSWORD=Tengsheng-Admin-2026
```

> Avoid `#` in `ADMIN_PASSWORD` unless the value is quoted; dotenv treats it as a comment.

## Production notes

- Node.js 22.23.5+ is required.
- The SQLite database (`tengsheng.db`) is created on the first **dev** boot. For production, run the CMS once with `npm run dev` locally, or add a database migration, before `npm run build`.
- To move to hosted infrastructure: switch `src/payload.config.ts` to `@payloadcms/db-postgres` and object storage (S3/R2), then deploy the CMS to Vercel, Railway or any Node host. The static site can stay on a CDN.

# Production image for the Payload CMS (Next.js, `next start`).
# Node 22.23.5 matches the engine requirement of Payload 3.93.

FROM node:22.23.5-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# A throwaway SQLite database lets Payload prerender pages during the build.
ENV DATABASE_URL=file:./build.db
ENV PAYLOAD_SECRET=build-only-secret
ENV PAYLOAD_PUSH=true
RUN mkdir -p public && npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

RUN mkdir -p media videos && chown -R nextjs:nodejs media videos

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]

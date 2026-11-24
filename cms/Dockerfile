# Production image for the Payload CMS (Next.js, `next start`).
# Debian slim is used instead of Alpine because sharp / libsql ship glibc
# prebuilds; if a native build is ever needed, python3/make/g++ are present.

FROM node:22.23.5-bookworm-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com \
 && npm config set replace-registry-host always \
 && npm ci --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# A throwaway SQLite database lets Payload prerender pages during the build.
ENV DATABASE_URL=file:./build.db
ENV PAYLOAD_SECRET=build-only-secret
ENV PAYLOAD_PUSH=true
RUN mkdir -p public && npm run build && npm prune --omit=dev

FROM node:22.23.5-bookworm-slim AS runner
RUN apt-get update \
 && apt-get install -y --no-install-recommends wget \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs
WORKDIR /app

COPY package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

RUN mkdir -p media videos && chown -R nextjs:nodejs media videos

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]

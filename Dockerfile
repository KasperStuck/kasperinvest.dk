ARG BUN_VERSION=1.4.2

FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app

# Stage 1: install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile --ignore-scripts --minimum-release-age 86400

# Stage 2: build the Astro site
FROM base AS build
ARG PUBLIC_SENTRY_DSN
ENV PUBLIC_SENTRY_DSN=$PUBLIC_SENTRY_DSN
# CONVEX_URL is read via astro:env at build time for prerendered data
ARG CONVEX_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: production runtime
FROM base AS runtime
# Bun as PID 1 ignores SIGTERM and the Astro entry installs no handler, so run under dumb-init.
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile --production --ignore-scripts --minimum-release-age 86400
COPY --from=build --chown=bun:bun /app/dist ./dist

USER bun
EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||4321)+'/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "./dist/server/entry.mjs"]

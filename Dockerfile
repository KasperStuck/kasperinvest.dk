# Build stage
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ENV CONVEX_URL=https://combative-spider-931.convex.cloud
RUN bun run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

ENV HOST=0.0.0.0
ENV PORT=80
ENV CONVEX_URL=https://combative-spider-931.convex.cloud
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:80/health.json').then(r=>{if(!r.ok)throw r.status}).catch(()=>process.exit(1))"

CMD ["node", "dist/server/entry.mjs"]

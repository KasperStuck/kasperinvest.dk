# Build stage
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG CONVEX_URL
RUN bun run build
RUN rm -rf node_modules && bun install --frozen-lockfile --production

# Runtime stage
FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=80
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD bun -e "fetch('http://localhost:80/health.json').then(r=>{if(!r.ok)throw r.status}).catch(()=>process.exit(1))"

CMD ["bun", "dist/server/entry.mjs"]

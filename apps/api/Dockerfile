FROM node:20-alpine AS builder
WORKDIR /repo

# Copy monorepo root manifests for workspace resolution
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm install --workspace=apps/api

COPY apps/api/ ./apps/api/

WORKDIR /repo/apps/api
RUN npx prisma generate
RUN npx tsc

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

# Run DB migrations then start the server
CMD ["sh", "-c", "node node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma && node dist/index.js"]

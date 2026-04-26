# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /repo

# Copy manifests first for better layer caching
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/

# Install full workspace dependencies (web build needs @vinotheque/core)
RUN npm install --ignore-scripts

# Copy the source
COPY . .

# Build the web app (vite -> dist/)
RUN npx vite build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /repo/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

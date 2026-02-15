# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npx tsc

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=backend-build /app/dist ./
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=frontend-build /app/dist ./public
EXPOSE 3001
CMD ["node", "index.js"]

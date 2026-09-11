# Stage 1: Base builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy root and package manifests
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm install

# Copy source trees
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
COPY apps/web ./apps/web

# Build shared library
RUN npm run build --prefix packages/shared

# Generate Prisma and build server
WORKDIR /app/apps/server
RUN npx prisma generate
RUN npm run build

# Build web frontend
WORKDIR /app/apps/web
RUN npm run build

# Stage 2: Server Runner
FROM node:22-alpine AS server-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma

WORKDIR /app/apps/server
EXPOSE 3001
CMD ["node", "dist/index.js"]

# Stage 3: Web Static Nginx Runner
FROM nginx:alpine AS web-runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

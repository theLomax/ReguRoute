# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable
RUN apk add --no-cache curl
ENV CI=true

# ---- Builder ----
FROM base AS builder
WORKDIR /usr/src/app/

# Copy root manifests and npmrc
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json .npmrc ./
COPY apps/backend/package.json apps/backend/tsconfig.json ./apps/backend/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy entire monorepo
COPY . .

# Build only backend
RUN pnpm --filter backend... run build

# Prepare backend for production
# Ensure a clean deploy folder and use legacy deploy to avoid workspace injection issues
RUN rm -rf /prod-backend \
  && pnpm --filter backend deploy --prod /prod-backend --legacy

# ---- Production ----
FROM node:20-alpine AS production
RUN corepack enable
WORKDIR /usr/src/app/

# Copy built backend with production node_modules
COPY --from=builder /prod-backend ./

EXPOSE 3000
CMD ["node", "dist/index.js"]

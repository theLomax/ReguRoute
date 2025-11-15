# ---- Base ----
# Sets up pnpm in a base image to be reused.
FROM node:20-alpine AS base
RUN corepack enable
ENV CI=true

# ---- Builder ----
# This stage builds the application. It installs all dependencies
# (including devDependencies) and runs the build script.
FROM base AS builder
WORKDIR /usr/src/app/

# First, copy only the dependency manifests to leverage Docker's cache.
# The lockfile is the most important file for a reproducible install.
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/

# Install all monorepo dependencies based on the lockfile.
RUN pnpm install --frozen-lockfile

# Now, copy the rest of the project source code.
COPY . .

# Build the backend application.
RUN pnpm -w run build

# ---- Production ----
# This is the final, lean image. It copies only the necessary
# artifacts from the builder stage.
FROM base AS production
WORKDIR /usr/src/app/

# Copy the compiled code and the backend's package.json
COPY --from=builder /usr/src/app/apps/backend/dist ./dist
COPY --from=builder /usr/src/app/apps/backend/package.json ./package.json

# Install only production dependencies.
RUN pnpm install --prod

EXPOSE 3000
CMD [ "node", "dist/index.js" ]
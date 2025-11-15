# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy the root package.json and the workspace config to the container
COPY package.json pnpm-workspace.yaml ./

# Copy the backend's package.json
COPY apps/backend/package.json ./apps/backend/

# Install dependencies using pnpm. This leverages the Docker cache.
RUN pnpm install --filter backend

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Your app binds to port 3000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 3000

# Define the command to run your app
CMD [ "pnpm", "--filter", "backend", "run", "dev" ]
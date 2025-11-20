#!/bin/sh

# Add the project's node_modules/.bin to the PATH
export PATH=/usr/src/app/node_modules/.bin:$PATH

# Exit immediately if a command exits with a non-zero status.
set -e

# Run the initial build.
echo "--- Running initial build ---"
tsc -p ./apps/backend/tsconfig.json

# Start the TypeScript compiler in watch mode in the background.
echo "--- Starting TSC in watch mode ---"
tsc -p ./apps/backend/tsconfig.json --watch &

# Start the server with Node's built-in watch flag.
echo "--- Starting server with node --watch ---"
exec node --watch ./apps/backend/dist/index.js
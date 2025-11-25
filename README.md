# ReguRoute

ReguRoute is a route-planning utility for US-based travel designed to assist users with navigating state and local regulations when traveling with regulated items. The app calculates and presents route options that minimize or avoid jurisdictions where a user's cargo would face increased legal restrictions and storage requirements.

## Project Structure

```
ReguRoute/
├── apps/
│   ├── backend/          # Fastify API server (TypeScript)
│   └── mobile/           # React Native app with Expo (TypeScript)
├── packages/
│   └── types/            # Shared TypeScript interfaces
├── data/                 # Map data and regulation datasets
└── docker-compose.yml    # Development environment orchestration
```

## Getting Started

### Prerequisites

1.  **[Node.js](https://nodejs.org/)**: v20 or later.
2.  **[pnpm](https://pnpm.io/installation)**: For managing dependencies in the monorepo.
3.  **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: For building and running the containerized services.

### Installation and Setup

1.  **Clone the Repository**
    ```sh
    git clone <your-repository-url>
    cd ReguRoute
    ```
2.  **Install Dependencies**
    Run the following command from the root of the project to install all dependencies for all workspaces.
    ```sh
    pnpm install
    ```

3.  **Set Up Map Data**
    The routing engine requires OpenStreetMap (OSM) data. For local development, we'll start with a small state like Delaware. The following command will automatically download the required map file.
    ```sh
    pnpm set-map delaware
    ```

## Running the Application

This is the recommended way to run the entire application stack, including the backend, database, and routing engine.

1.  **Launch the Environment**
    This command will build the necessary Docker images and start all services defined in `docker-compose.yml`.
    ```sh
    docker compose up --build
    ```
    *Note: The first time you run this, the `reguroute-ors` service will take several minutes to process the map data and build the routing graph. Subsequent startups will be much faster.*

2.  **Verify Services**
    Once the logs have settled, you can verify that each service is running correctly:
    - **Backend**: Visit `http://localhost:3000` in your browser. You should see `{"hello":"world"}`.
    - **Routing Engine**: Visit `http://localhost:8080/ors/v2/health`. You should see `{"status":"ready"}`.
    - **Database**: Connect to the database using a client like DBeaver or TablePlus with the credentials from the `docker-compose.yml` file (host: `localhost`, port: `5432`).

### Docker Commands Reference

#### Starting Services
```bash
# Start all services (build if needed)
docker compose up --build

# Start services in detached mode (background)
docker compose up -d

# Start only specific services
docker compose up backend db
```

#### Stopping Services
```bash
# Stop all running services (keeps containers)
docker compose stop

# Stop and remove containers, networks
docker compose down

# Stop and remove containers, networks, and volumes (WARNING: deletes database data)
docker compose down -v
```

#### Viewing Logs
```bash
# View logs from all services (follow mode)
docker compose logs -f

# View logs from a specific service
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f reguroute-ors

# View last 100 lines of logs
docker compose logs --tail=100 backend
```

#### Service Status and Management
```bash
# List running containers
docker compose ps

# Restart a specific service
docker compose restart backend

# Restart all services
docker compose restart

# Execute commands in a running container
docker compose exec backend sh
docker compose exec db psql -U postgres -d reguroute
```

#### Cleanup
```bash
# Remove stopped containers
docker compose rm

# Remove all unused images, containers, networks
docker system prune

# Remove all unused images, containers, networks, and volumes (WARNING: aggressive cleanup)
docker system prune -a --volumes
```

## Database Migrations

The backend uses `node-pg-migrate` to manage database schema changes. Migrations are version-controlled TypeScript files that allow you to evolve your database schema safely.

### Running Migrations

To apply all pending migrations:
```bash
docker compose exec backend sh -c "cd apps/backend && pnpm run migrate:up"
```

### Creating New Migrations

To create a new migration file:
```bash
docker compose exec backend sh -c "cd apps/backend && pnpm run migrate:create <migration-name>"
```

This will create a new TypeScript file in `apps/backend/migrations/` with an `up` function (to apply changes) and a `down` function (to roll back changes).

### Rolling Back Migrations

To roll back the last migration:
```bash
docker compose exec backend sh -c "cd apps/backend && pnpm run migrate:down"
```

## Authentication API

The backend provides JWT-based authentication endpoints. You'll need a valid JWT token to access protected routes.

### Environment Setup

Create a `.env` file in `apps/backend/` with:
```
DATABASE_URL=postgres://postgres:postgres@db:5432/reguroute
JWT_SECRET=your-secret-key-here
```

### Register a New User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Response:** Same format as register.

### Get Current User (Protected)

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <your-token>"
```
> Use the token from the login response above.


**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Routes API

The backend provides endpoints for saving and managing user routes. All routes endpoints require authentication.

### Create a Route

```bash
curl -X POST http://localhost:3000/routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Trip to Delaware",
    "origin_name": "Philadelphia, PA",
    "origin_lat": 39.9526,
    "origin_lng": -75.1652,
    "destination_name": "Wilmington, DE",
    "destination_lat": 39.7447,
    "destination_lng": -75.5484
  }'
```

**Response:**
```json
{
  "route": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Trip to Delaware",
    "origin_name": "Philadelphia, PA",
    "origin_lat": "39.9526000",
    "origin_lng": "-75.1652000",
    "destination_name": "Wilmington, DE",
    "destination_lat": "39.7447000",
    "destination_lng": "-75.5484000",
    "waypoints": [],
    "route_geometry": null,
    "route_metadata": null,
    "cargo_profile": null,
    "regulation_alerts": [],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### List All Routes

```bash
curl http://localhost:3000/routes \
  -H "Authorization: Bearer <your-token>"
```

### Get a Specific Route

```bash
curl http://localhost:3000/routes/<route-id> \
  -H "Authorization: Bearer <your-token>"
```

### Update a Route

```bash
curl -X PUT http://localhost:3000/routes/<route-id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name": "Updated Trip Name"}'
```

### Delete a Route

```bash
curl -X DELETE http://localhost:3000/routes/<route-id> \
  -H "Authorization: Bearer <your-token>"
```

## Route Calculation API

The backend integrates with OpenRouteService (ORS) to calculate driving routes.

### Check ORS Status

```bash
curl http://localhost:3000/calculate/health
```

**Response (when ready):**
```json
{"status":"ready","ready":true}
```

### Calculate a Route

```bash
curl -X POST http://localhost:3000/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"lat": 39.9526, "lng": -75.1652},
    "destination": {"lat": 39.7447, "lng": -75.5484},
    "profile": "driving-car"
  }'
```

**Response:**
```json
{
  "route": {
    "geometry": { "type": "LineString", "coordinates": [...] },
    "summary": {
      "distance_meters": 45000,
      "distance_km": 45.0,
      "distance_miles": 28.0,
      "duration_seconds": 2700,
      "duration_minutes": 45
    },
    "segments": [...],
    "bbox": [-75.55, 39.74, -75.16, 39.95]
  }
}
```

### Calculate and Save a Route (Protected)

```bash
curl -X POST http://localhost:3000/calculate/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Philly to Wilmington",
    "origin": {"lat": 39.9526, "lng": -75.1652},
    "destination": {"lat": 39.7447, "lng": -75.5484}
  }'
```

This calculates the route and saves it to the database in one request.

## Regulation Analysis API

Analyze routes or states against firearm transport regulations to generate compliance alerts.

### Analyze by States

Analyze a list of state postal codes against regulation data:

```bash
curl -X POST http://localhost:3000/analyze/states \
  -H "Content-Type: application/json" \
  -d '{
    "states": ["DE", "MD", "NJ"],
    "cargo_profile": {
      "has_firearms": true,
      "magazine_capacity": 15,
      "has_assault_weapon": false
    }
  }'
```

**Response:**
```json
{
  "analysis": {
    "jurisdictions_crossed": ["Delaware (DE)", "Maryland (MD)", "New Jersey (NJ)"],
    "alerts": [
      {
        "jurisdiction": "Maryland",
        "postal_code": "MD",
        "severity": "critical",
        "category": "Magazine Capacity",
        "message": "Maryland limits magazine capacity to 10 rounds. Your 15-round magazines are prohibited.",
        "citation": "Md. Code, Crim. Law § 4-305"
      }
    ],
    "summary": {
      "total_jurisdictions": 3,
      "critical_alerts": 4,
      "warning_alerts": 3,
      "info_alerts": 0
    }
  }
}
```

### Analyze by Route Geometry

Analyze a GeoJSON LineString route geometry:

```bash
curl -X POST http://localhost:3000/analyze/geometry \
  -H "Content-Type: application/json" \
  -d '{
    "route_geometry": {
      "type": "LineString",
      "coordinates": [[-75.5, 39.7], [-75.3, 39.8], [-75.1, 39.9]]
    },
    "cargo_profile": {
      "has_firearms": true,
      "has_concealed_carry_permit": true,
      "permit_states": ["PA"]
    }
  }'
```

### Analyze a Saved Route (Protected)

Analyze a previously saved route by ID:

```bash
curl -X POST http://localhost:3000/analyze/route/<route-id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "cargo_profile": {
      "has_firearms": true,
      "magazine_capacity": 10
    }
  }'
```

### Cargo Profile Options

| Field | Type | Description |
|-------|------|-------------|
| `has_firearms` | boolean | **Required.** Whether transporting firearms |
| `firearm_types` | string[] | Types: `handgun`, `rifle`, `shotgun` |
| `has_concealed_carry_permit` | boolean | Whether user has a CCW permit |
| `permit_states` | string[] | States where permit is valid |
| `magazine_capacity` | number | Maximum magazine capacity being transported |
| `has_assault_weapon` | boolean | Whether transporting assault-style weapons |

### Alert Severity Levels

- **critical** - Immediate legal concern (e.g., banned items, no-issue states)
- **warning** - Permit or transport requirements may apply
- **info** - General information about local regulations

## Mobile App Development

The mobile app is a React Native application built with Expo, located in `apps/mobile/`.

### Prerequisites

- **Expo Go app** on your iOS or Android device (available from App Store / Google Play)
- Backend services running via `docker compose up`

### Running the Mobile App

#### Start Development Server
```bash
# Start the Expo development server
pnpm --filter mobile start

# Start with cache cleared
pnpm --filter mobile start --clear
```

This starts the Expo development server. You can then:
- Scan the QR code with Expo Go (Android) or Camera app (iOS)
- Press `a` to open in Android emulator
- Press `i` to open in iOS simulator (macOS only)
- Press `w` to open in web browser

#### Expo Commands Reference

```bash
# Start the development server
pnpm --filter mobile start

# Run on Android device/emulator
pnpm --filter mobile android

# Run on iOS simulator (macOS only)
pnpm --filter mobile ios

# Run in web browser
pnpm --filter mobile web

# TypeScript type checking
pnpm --filter mobile typecheck

# Lint the code
pnpm --filter mobile lint

# Run tests
pnpm --filter mobile test

# Clear Expo cache and restart
pnpm --filter mobile start --clear
```

#### Environment Configuration

The mobile app connects to the backend API. Make sure to configure the API URL:

**For local development:**
- Android Emulator: `http://10.0.2.2:3000`
- iOS Simulator: `http://localhost:3000`
- Physical Device: `http://<your-computer-ip>:3000`

You can find your computer's IP address:
```bash
# macOS/Linux
ipconfig getifaddr en0

# Windows
ipconfig
```

### Shared Types

The mobile app uses shared TypeScript interfaces from `packages/types`. This ensures type consistency between the backend API and mobile client:

```typescript
import { User, Route, CargoProfile } from '@reguroute/types';
```

To check types across all packages:
```bash
pnpm --filter @reguroute/types typecheck
```

## Advanced Development: Running Services in Isolation

If you need to work on a single service, you can run it independently of the Docker Compose environment.

### Backend Service

#### With Docker

1.  **Build the Docker image:**
    From the root of the project, run:
    ```bash
    docker build -t reguroute-backend -f apps/backend/Dockerfile .
    ```

2.  **Run the container:**
    ```bash
    docker run --rm -p 3000:3000 --name reguroute-backend-container reguroute-backend
    ```

#### Locally (with Hot-Reloading)

After running `pnpm install` from the project root, you can start the development server:
```sh
pnpm --filter backend run dev
```

---

#### How Docker and pnpm Work Together
You might notice a few places where Docker and pnpm seem to override each other. This is intentional and allows us to use the same Dockerfile for both a lean production build and a powerful development environment with live-reloading. Here's how it works:

##### 1. The Production Dockerfile
The apps/backend/Dockerfile is optimized for production. It performs a multi-stage build to create a small, efficient image that contains only the compiled JavaScript (dist folder) and production node_modules. Its final command (CMD) is node dist/index.js, which is meant to run the pre-built application.

##### 2. The Development docker-compose.yml
The docker-compose.yml file adapts this production-ready image for development using two key overrides:

**volumes:** The line volumes: - ./apps/backend:/usr/src/app/apps/backend mounts your local apps/backend folder directly into the container. This is what enables live-reloading. When you change a file on your machine, it's instantly updated inside the container. However, this also means your local folder hides the dist folder that was created inside the image during the build.

**command:** Because the dist folder is hidden, the Dockerfile's default CMD would fail. To fix this, we override it with command: pnpm run dev. This tells the container to run the development script, which uses nodemon and ts-node to execute your TypeScript source code directly from the mounted volume.

By combining these two overrides, you get a development environment where your code changes are reflected immediately, without needing to rebuild the Docker image.
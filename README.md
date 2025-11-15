# ReguRoute

ReguRoute is a route-planning utility for US-based travel designed to assist users with navigating state and local regulations when traveling with regulated items. The app calculates and presents route options that minimize or avoid jurisdictions where a user's cargo would face increased legal restrictions and storage requirements.

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
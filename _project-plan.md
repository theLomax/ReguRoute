# ReguRoute Project Plan

This document outlines the project brief, architecture, and development task list for the ReguRoute application.

### 1. App Description
The application is a route-planning utility for US-based travel. Users will input their origin, destination, and a profile of the regulated items they are transporting (e.g., firearm type, magazine capacity). The app will then calculate and present route options that minimize or avoid jurisdictions where the user's cargo would face increased legal restrictions. The core value is providing peace of mind and compliance-aware logistical planning, not legal advice.

#### Core Features:

##### Route Planning:
Input origin, destination, and optional waypoints.

##### Cargo Specification:
Define a detailed profile of firearms, magazines, and accessories being transported.

##### Compliance-Aware Routing:
Utilize OpenRouteService's "avoid polygons" feature to generate routes that detour around areas with stricter regulations relative to the user's cargo.

##### Route Analysis:
Display turn-by-turn directions with clear, context-aware alerts for jurisdictions with specific transport laws (e.g., "While in Colorado, firearm must be cased and unloaded").

##### Crowdsourced Regulations (Post-Launch):
A "Wikipedia-style" system for ongoing maintenance where users can suggest updates to the legal database, which are then verified by vetted regional maintainers. The initial database will be manually seeded with verified data prior to launch.

##### Anecdotal Reports:
A "Waze-style" feature for users to leave time-sensitive, geotagged reports on road conditions or law enforcement activity.

### 2. Technical Architecture & Stack
The project will be architected with a clean separation between the frontend and backend, prioritizing modern, open-source, and cost-effective technologies.

##### Component Technology	→	Notes

Architecture	→	Monorepo w/ Git Submodules	→	Enforces clear separation between frontend and backend codebases.
Frontend	→	React Native, Expo Go, TypeScript	→	For rapid, multi-OS native app development.
Backend	→	Node.js, Fastify, TypeScript	→	A high-performance, modern stack that leverages existing JavaScript/TS skills.
Database	→	PostgreSQL with PostGIS	→	The industry standard for relational data with powerful geospatial capabilities.
Routing Service	→	OpenRouteService	→	Powerful open-source routing engine with the critical avoid_polygons feature.

### 3. Deployment, Hosting & Cost
The entire stack is designed to be developed and deployed with a starting cost of $0, leveraging generous free tiers from modern service providers.

##### Service	Provider	Free Tier & Cost Notes
Local Dev	Docker / Docker Compose	Free for personal use. Provides a consistent, isolated local environment.

Backend Hosting	→	Render: \$0. The free tier for Web Services is perfect for hosting the Fastify app. It will "spin down" on inactivity, which is acceptable for development and initial launch.

Database	→	Supabase	→	\$0. The free tier includes a full Postgres database with PostGIS enabled, plus generous storage and usage quotas.

Authentication	→	Supabase Auth	→	\$0. Included with Supabase. Provides secure user management out of the box.

Object Storage	→	Supabase Storage	→	\$0. Included with Supabase. Ideal for handling user-uploaded files for regulation suggestions.

CI/CD	→	GitHub Actions	→	\$0. Free for public repos (with a large quota for private) to automate testing and deployment to Render.

This stack ensures there are no surprise bills. Costs will only be incurred if the application's usage grows to a point where it's necessary to upgrade to paid plans on Render or Supabase.

### 4. Projected Timeline (High-Level)
This is a phased timeline suitable for a learning project.

#### Phase 1: Foundation & Backend Core (Weeks 1-3)

- Set up monorepo and Git submodule structure.
- Configure local development environment with Docker Compose.
- Design and implement the core database schema in PostgreSQL.
- Set up Fastify backend with basic health-check endpoints.
- Connect Fastify to the database.

#### Phase 2: Frontend & API Integration (Weeks 4-6)

- Scaffold the React Native app using Expo and TypeScript.
- Implement basic UI screens for route and cargo input.
- Set up user authentication flow using Supabase Auth on the client and server.
- Connect the frontend to the backend API.

#### Phase 3: Core Feature Implementation (Weeks 7-10)

- Build the backend logic to query the regulations database based on cargo.
- Integrate with OpenRouteService to fetch routes, applying avoidance polygons.
- Develop the frontend map view to display route options and warnings.

#### Phase 4: Crowdsourcing & Polish (Weeks 11-14)

- Build the API endpoints and UI for submitting and moderating regulation suggestions.
- Implement the "user reports" feature.
- Refine UI/UX, add onboarding, and implement the legal disclaimer.
- Thorough end-to-end testing.

### 5. Key Notes & Risks

#### Legal Disclaimer:
The app must feature a prominent, non-dismissible disclaimer stating that it provides informational guidance and does not constitute legal advice. This is the single most important risk-mitigation measure.

#### Data Accuracy ("Source of Truth"):
The biggest non-technical challenge. The initial launch will depend on a manually seeded and verified database to ensure high quality from day one. The long-term success of the app will then hinge on the quality and timeliness of the crowdsourced maintenance process. The maintainer/verification system is critical to building and maintaining user trust.

#### Geographic Precision:
Initial implementation should focus on state-level regulations. A future iteration must incorporate a system for handling stricter city- or county-level ordinances (e.g., New York City, Chicago).

---

## Development Task List

This section tracks the major development tasks, marking what has been completed and what remains.

### Phase 1: Backend & Infrastructure Setup (✓ Complete)
- [x] Initialize pnpm monorepo for frontend and backend workspaces.
- [x] Create a basic Fastify server for the backend using TypeScript.
- [x] Develop a multi-stage `Dockerfile` for production-ready backend containerization.
- [x] Set up `docker-compose.yml` to orchestrate the backend, database (PostGIS), and routing engine (ORS).
- [x] Implement live-reloading for the backend service in the Docker Compose environment.
- [x] Add a health check endpoint to the backend and configure it in Docker Compose.
- [x] Establish and test a database connection from the backend to the PostGIS container.
- [x] Document the project setup and development workflow in `README.md`.

### Phase 2: Core Backend Logic (In Progress)
- [x] Set up a database migration system using `node-pg-migrate`.
- [x] Create initial user authentication table with UUID primary keys and secure password storage.
- [ ] Define database schema for regulations, states, and jurisdictions.
- [ ] Create API endpoints for user registration and authentication.
- [ ] Create API endpoints for saving and retrieving user routes.
- [ ] Develop logic to query the OpenRouteService (ORS) API for route calculation.
- [ ] Implement business logic to analyze routes against regulation data from the database.

### Phase 3: Frontend Development
- [ ] Scaffold the frontend application (e.g., using React/Vite).
- [ ] Create a `Dockerfile` for the frontend service.
- [ ] Integrate the frontend service into `docker-compose.yml`.
- [ ] Develop UI components for user input (start/end points, cargo details).
- [ ] Integrate a mapping library (e.g., Leaflet, Mapbox) to display routes.

### Phase 4: Deployment & CI/CD
- [ ] Create a CI/CD pipeline (e.g., using GitHub Actions) to build and test on push.
- [ ] Prepare the application for deployment to a cloud provider.
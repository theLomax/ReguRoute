import { FastifyInstance } from 'fastify';
import {
	analyzeRoute,
	analyzeRouteByStates,
	type CargoProfile,
} from '../services/regulations.js';

interface AnalyzeByGeometryBody {
	route_geometry: GeoJSON.LineString;
	cargo_profile: CargoProfile;
}

interface AnalyzeByStatesBody {
	states: string[];
	cargo_profile: CargoProfile;
}

interface AnalyzeRouteByIdParams {
	id: string;
}

interface AnalyzeRouteByIdBody {
	cargo_profile: CargoProfile;
}

const cargoProfileSchema = {
	type: 'object',
	required: ['has_firearms'],
	properties: {
		has_firearms: { type: 'boolean' },
		firearm_types: {
			type: 'array',
			items: { type: 'string', enum: ['handgun', 'rifle', 'shotgun'] },
		},
		has_concealed_carry_permit: { type: 'boolean' },
		permit_states: { type: 'array', items: { type: 'string' } },
		magazine_capacity: { type: 'number' },
		has_assault_weapon: { type: 'boolean' },
	},
};

export async function analyzeRoutes(fastify: FastifyInstance) {
	// POST /analyze/geometry - Analyze a route by its geometry
	fastify.post<{ Body: AnalyzeByGeometryBody }>(
		'/geometry',
		{
			schema: {
				body: {
					type: 'object',
					required: ['route_geometry', 'cargo_profile'],
					properties: {
						route_geometry: {
							type: 'object',
							required: ['type', 'coordinates'],
							properties: {
								type: { type: 'string', const: 'LineString' },
								coordinates: {
									type: 'array',
									items: {
										type: 'array',
										items: { type: 'number' },
										minItems: 2,
										maxItems: 2,
									},
								},
							},
						},
						cargo_profile: cargoProfileSchema,
					},
				},
			},
		},
		async (request, reply) => {
			const { route_geometry, cargo_profile } = request.body;

			const client = await fastify.pg.connect();
			try {
				const analysis = await analyzeRoute(client, route_geometry, cargo_profile);
				return { analysis };
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Analysis failed';
				fastify.log.error(error, 'Route analysis failed');
				return reply.code(500).send({ error: message });
			} finally {
				client.release();
			}
		}
	);

	// POST /analyze/states - Analyze by state postal codes
	fastify.post<{ Body: AnalyzeByStatesBody }>(
		'/states',
		{
			schema: {
				body: {
					type: 'object',
					required: ['states', 'cargo_profile'],
					properties: {
						states: {
							type: 'array',
							items: { type: 'string', minLength: 2, maxLength: 2 },
							minItems: 1,
						},
						cargo_profile: cargoProfileSchema,
					},
				},
			},
		},
		async (request, reply) => {
			const { states, cargo_profile } = request.body;

			const client = await fastify.pg.connect();
			try {
				const analysis = await analyzeRouteByStates(
					client,
					states.map((s) => s.toUpperCase()),
					cargo_profile
				);
				return { analysis };
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Analysis failed';
				fastify.log.error(error, 'Route analysis by states failed');
				return reply.code(500).send({ error: message });
			} finally {
				client.release();
			}
		}
	);

	// POST /analyze/route/:id - Analyze a saved route (requires auth)
	fastify.post<{ Params: AnalyzeRouteByIdParams; Body: AnalyzeRouteByIdBody }>(
		'/route/:id',
		{
			onRequest: [fastify.authenticate],
			schema: {
				params: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'string', format: 'uuid' },
					},
				},
				body: {
					type: 'object',
					required: ['cargo_profile'],
					properties: {
						cargo_profile: cargoProfileSchema,
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { cargo_profile } = request.body;

			const client = await fastify.pg.connect();
			try {
				// Fetch the saved route
				const routeResult = await client.query(
					`SELECT route_geometry FROM routes WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (routeResult.rows.length === 0) {
					return reply.code(404).send({ error: 'Route not found' });
				}

				const routeGeometry = routeResult.rows[0].route_geometry;

				if (!routeGeometry) {
					return reply.code(400).send({
						error: 'Route has no geometry. Please calculate the route first.',
					});
				}

				const analysis = await analyzeRoute(
					client,
					routeGeometry as GeoJSON.LineString,
					cargo_profile
				);

				// Optionally update the route with regulation alerts
				await client.query(
					`UPDATE routes SET regulation_alerts = $1, updated_at = current_timestamp WHERE id = $2`,
					[JSON.stringify(analysis.alerts), id]
				);

				return { analysis };
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Analysis failed';
				fastify.log.error(error, 'Saved route analysis failed');
				return reply.code(500).send({ error: message });
			} finally {
				client.release();
			}
		}
	);
}

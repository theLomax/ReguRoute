import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface Waypoint {
	name: string;
	lat: number;
	lng: number;
}

interface CreateRouteBody {
	name: string;
	origin_name: string;
	origin_lat: number;
	origin_lng: number;
	destination_name: string;
	destination_lat: number;
	destination_lng: number;
	waypoints?: Waypoint[];
	route_geometry?: object;
	route_metadata?: object;
	cargo_profile?: object;
	regulation_alerts?: object[];
}

interface UpdateRouteBody {
	name?: string;
	origin_name?: string;
	origin_lat?: number;
	origin_lng?: number;
	destination_name?: string;
	destination_lat?: number;
	destination_lng?: number;
	waypoints?: Waypoint[];
	route_geometry?: object;
	route_metadata?: object;
	cargo_profile?: object;
	regulation_alerts?: object[];
}

interface RouteParams {
	id: string;
}

export async function routesRoutes(fastify: FastifyInstance) {
	// All routes in this plugin require authentication
	fastify.addHook('onRequest', fastify.authenticate);

	// POST /routes - Create a new route
	fastify.post<{ Body: CreateRouteBody }>(
		'/',
		{
			schema: {
				body: {
					type: 'object',
					required: [
						'name',
						'origin_name',
						'origin_lat',
						'origin_lng',
						'destination_name',
						'destination_lat',
						'destination_lng',
					],
					properties: {
						name: { type: 'string', minLength: 1, maxLength: 255 },
						origin_name: { type: 'string', minLength: 1, maxLength: 255 },
						origin_lat: { type: 'number', minimum: -90, maximum: 90 },
						origin_lng: { type: 'number', minimum: -180, maximum: 180 },
						destination_name: { type: 'string', minLength: 1, maxLength: 255 },
						destination_lat: { type: 'number', minimum: -90, maximum: 90 },
						destination_lng: { type: 'number', minimum: -180, maximum: 180 },
						waypoints: {
							type: 'array',
							items: {
								type: 'object',
								required: ['name', 'lat', 'lng'],
								properties: {
									name: { type: 'string' },
									lat: { type: 'number', minimum: -90, maximum: 90 },
									lng: { type: 'number', minimum: -180, maximum: 180 },
								},
							},
						},
						route_geometry: { type: 'object' },
						route_metadata: { type: 'object' },
						cargo_profile: { type: 'object' },
						regulation_alerts: { type: 'array' },
					},
				},
			},
		},
		async (request, reply) => {
			const {
				name,
				origin_name,
				origin_lat,
				origin_lng,
				destination_name,
				destination_lat,
				destination_lng,
				waypoints,
				route_geometry,
				route_metadata,
				cargo_profile,
				regulation_alerts,
			} = request.body;

			const client = await fastify.pg.connect();
			try {
				const result = await client.query(
					`INSERT INTO routes (
						user_id, name,
						origin_name, origin_lat, origin_lng,
						destination_name, destination_lat, destination_lng,
						waypoints, route_geometry, route_metadata,
						cargo_profile, regulation_alerts
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
					RETURNING *`,
					[
						request.user.id,
						name,
						origin_name,
						origin_lat,
						origin_lng,
						destination_name,
						destination_lat,
						destination_lng,
						JSON.stringify(waypoints || []),
						route_geometry ? JSON.stringify(route_geometry) : null,
						route_metadata ? JSON.stringify(route_metadata) : null,
						cargo_profile ? JSON.stringify(cargo_profile) : null,
						JSON.stringify(regulation_alerts || []),
					]
				);

				return reply.code(201).send({ route: result.rows[0] });
			} finally {
				client.release();
			}
		}
	);

	// GET /routes - List all routes for the current user
	fastify.get('/', async (request, reply) => {
		const client = await fastify.pg.connect();
		try {
			const result = await client.query(
				`SELECT id, name, origin_name, destination_name, created_at, updated_at
				 FROM routes
				 WHERE user_id = $1
				 ORDER BY created_at DESC`,
				[request.user.id]
			);

			return { routes: result.rows };
		} finally {
			client.release();
		}
	});

	// GET /routes/:id - Get a specific route
	fastify.get<{ Params: RouteParams }>(
		'/:id',
		{
			schema: {
				params: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'string', format: 'uuid' },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;

			const client = await fastify.pg.connect();
			try {
				const result = await client.query(
					`SELECT * FROM routes WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'Route not found' });
				}

				return { route: result.rows[0] };
			} finally {
				client.release();
			}
		}
	);

	// PUT /routes/:id - Update a route
	fastify.put<{ Params: RouteParams; Body: UpdateRouteBody }>(
		'/:id',
		{
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
					properties: {
						name: { type: 'string', minLength: 1, maxLength: 255 },
						origin_name: { type: 'string', minLength: 1, maxLength: 255 },
						origin_lat: { type: 'number', minimum: -90, maximum: 90 },
						origin_lng: { type: 'number', minimum: -180, maximum: 180 },
						destination_name: { type: 'string', minLength: 1, maxLength: 255 },
						destination_lat: { type: 'number', minimum: -90, maximum: 90 },
						destination_lng: { type: 'number', minimum: -180, maximum: 180 },
						waypoints: { type: 'array' },
						route_geometry: { type: 'object' },
						route_metadata: { type: 'object' },
						cargo_profile: { type: 'object' },
						regulation_alerts: { type: 'array' },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const updates = request.body;

			const client = await fastify.pg.connect();
			try {
				// First check if route exists and belongs to user
				const existingRoute = await client.query(
					`SELECT id FROM routes WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (existingRoute.rows.length === 0) {
					return reply.code(404).send({ error: 'Route not found' });
				}

				// Build dynamic update query
				const setClauses: string[] = [];
				const values: unknown[] = [];
				let paramIndex = 1;

				const fields = [
					'name',
					'origin_name',
					'origin_lat',
					'origin_lng',
					'destination_name',
					'destination_lat',
					'destination_lng',
				];
				const jsonFields = [
					'waypoints',
					'route_geometry',
					'route_metadata',
					'cargo_profile',
					'regulation_alerts',
				];

				for (const field of fields) {
					if (updates[field as keyof UpdateRouteBody] !== undefined) {
						setClauses.push(`${field} = $${paramIndex}`);
						values.push(updates[field as keyof UpdateRouteBody]);
						paramIndex++;
					}
				}

				for (const field of jsonFields) {
					if (updates[field as keyof UpdateRouteBody] !== undefined) {
						setClauses.push(`${field} = $${paramIndex}`);
						values.push(JSON.stringify(updates[field as keyof UpdateRouteBody]));
						paramIndex++;
					}
				}

				if (setClauses.length === 0) {
					return reply.code(400).send({ error: 'No fields to update' });
				}

				// Always update updated_at
				setClauses.push(`updated_at = current_timestamp`);

				values.push(id);
				values.push(request.user.id);

				const result = await client.query(
					`UPDATE routes
					 SET ${setClauses.join(', ')}
					 WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
					 RETURNING *`,
					values
				);

				return { route: result.rows[0] };
			} finally {
				client.release();
			}
		}
	);

	// DELETE /routes/:id - Delete a route
	fastify.delete<{ Params: RouteParams }>(
		'/:id',
		{
			schema: {
				params: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'string', format: 'uuid' },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;

			const client = await fastify.pg.connect();
			try {
				const result = await client.query(
					`DELETE FROM routes WHERE id = $1 AND user_id = $2 RETURNING id`,
					[id, request.user.id]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'Route not found' });
				}

				return reply.code(204).send();
			} finally {
				client.release();
			}
		}
	);
}

import { FastifyInstance } from 'fastify';
import {
	calculateRoute,
	checkORSHealth,
	getORSStatus,
	type Coordinate,
	type RouteResult,
} from '../services/ors.js';

interface CalculateRouteBody {
	origin: Coordinate;
	destination: Coordinate;
	waypoints?: Coordinate[];
	profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking';
	avoid_polygons?: GeoJSON.MultiPolygon;
}

interface SaveCalculatedRouteBody extends CalculateRouteBody {
	name: string;
}

const coordinateSchema = {
	type: 'object',
	required: ['lat', 'lng'],
	properties: {
		lat: { type: 'number', minimum: -90, maximum: 90 },
		lng: { type: 'number', minimum: -180, maximum: 180 },
	},
};

export async function calculateRoutes(fastify: FastifyInstance) {
	// GET /calculate/health - Check ORS service health
	fastify.get('/health', async (request, reply) => {
		const health = await checkORSHealth();
		if (!health.ready) {
			return reply.code(503).send({
				status: 'unavailable',
				message: 'OpenRouteService is not ready. It may still be building the routing graph.',
			});
		}
		return health;
	});

	// GET /calculate/status - Get ORS service status and available profiles
	fastify.get('/status', async (request, reply) => {
		return await getORSStatus();
	});

	// POST /calculate - Calculate a route without saving
	fastify.post<{ Body: CalculateRouteBody }>(
		'/',
		{
			schema: {
				body: {
					type: 'object',
					required: ['origin', 'destination'],
					properties: {
						origin: coordinateSchema,
						destination: coordinateSchema,
						waypoints: {
							type: 'array',
							items: coordinateSchema,
						},
						profile: {
							type: 'string',
							enum: ['driving-car', 'driving-hgv', 'cycling-regular', 'foot-walking'],
							default: 'driving-car',
						},
						avoid_polygons: {
							type: 'object',
							description: 'GeoJSON MultiPolygon of areas to avoid',
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { origin, destination, waypoints, profile, avoid_polygons } = request.body;

			try {
				const route = await calculateRoute({
					origin,
					destination,
					waypoints,
					profile,
					avoidPolygons: avoid_polygons,
				});

				return {
					route: {
						geometry: route.geometry,
						summary: {
							distance_meters: route.summary.distance,
							distance_km: Math.round((route.summary.distance / 1000) * 10) / 10,
							distance_miles: Math.round((route.summary.distance / 1609.34) * 10) / 10,
							duration_seconds: route.summary.duration,
							duration_minutes: Math.round(route.summary.duration / 60),
						},
						segments: route.segments,
						bbox: route.bbox,
					},
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Route calculation failed';
				return reply.code(500).send({ error: message });
			}
		}
	);

	// POST /calculate/save - Calculate a route and save it (requires auth)
	fastify.post<{ Body: SaveCalculatedRouteBody }>(
		'/save',
		{
			onRequest: [fastify.authenticate],
			schema: {
				body: {
					type: 'object',
					required: ['name', 'origin', 'destination'],
					properties: {
						name: { type: 'string', minLength: 1, maxLength: 255 },
						origin: coordinateSchema,
						destination: coordinateSchema,
						waypoints: {
							type: 'array',
							items: coordinateSchema,
						},
						profile: {
							type: 'string',
							enum: ['driving-car', 'driving-hgv', 'cycling-regular', 'foot-walking'],
							default: 'driving-car',
						},
						avoid_polygons: {
							type: 'object',
							description: 'GeoJSON MultiPolygon of areas to avoid',
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { name, origin, destination, waypoints, profile, avoid_polygons } = request.body;

			let routeResult: RouteResult;
			try {
				routeResult = await calculateRoute({
					origin,
					destination,
					waypoints,
					profile,
					avoidPolygons: avoid_polygons,
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Route calculation failed';
				return reply.code(500).send({ error: message });
			}

			// Save the calculated route to the database
			const client = await fastify.pg.connect();
			try {
				const result = await client.query(
					`INSERT INTO routes (
						user_id, name,
						origin_name, origin_lat, origin_lng,
						destination_name, destination_lat, destination_lng,
						waypoints, route_geometry, route_metadata
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
					RETURNING *`,
					[
						request.user.id,
						name,
						`${origin.lat}, ${origin.lng}`, // Use coordinates as name for now
						origin.lat,
						origin.lng,
						`${destination.lat}, ${destination.lng}`,
						destination.lat,
						destination.lng,
						JSON.stringify(waypoints || []),
						JSON.stringify(routeResult.geometry),
						JSON.stringify({
							summary: routeResult.summary,
							bbox: routeResult.bbox,
							profile: profile || 'driving-car',
						}),
					]
				);

				return reply.code(201).send({
					route: result.rows[0],
					calculated: {
						geometry: routeResult.geometry,
						summary: {
							distance_meters: routeResult.summary.distance,
							distance_km: Math.round((routeResult.summary.distance / 1000) * 10) / 10,
							distance_miles: Math.round((routeResult.summary.distance / 1609.34) * 10) / 10,
							duration_seconds: routeResult.summary.duration,
							duration_minutes: Math.round(routeResult.summary.duration / 60),
						},
						segments: routeResult.segments,
						bbox: routeResult.bbox,
					},
				});
			} finally {
				client.release();
			}
		}
	);
}

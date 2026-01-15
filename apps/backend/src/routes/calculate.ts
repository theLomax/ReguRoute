import { FastifyInstance } from 'fastify';
import {
	calculateRoute,
	checkORSHealth,
	getORSStatus,
	type Coordinate,
	type RouteResult,
} from '../services/ors.js';
import { analyzeRoute, type CargoProfile } from '../services/regulations.js';

interface CalculateRouteBody {
	origin: Coordinate;
	destination: Coordinate;
	waypoints?: Coordinate[];
	profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking';
	avoid_polygons?: GeoJSON.MultiPolygon;
	cargo_profile?: CargoProfile;
}

interface SaveCalculatedRouteBody extends CalculateRouteBody {
	name: string;
	loadout_id?: string;
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

	// POST /calculate/validate-locations - Pre-validate locations before route calculation
	fastify.post(
		'/validate-locations',
		{
			onRequest: [fastify.authenticate],
			schema: {
				body: {
					type: 'object',
					required: ['loadout_id', 'locations'],
					properties: {
						loadout_id: { type: 'string', format: 'uuid' },
						locations: {
							type: 'array',
							items: {
								type: 'object',
								required: ['lat', 'lng', 'name', 'type'],
								properties: {
									lat: { type: 'number', minimum: -90, maximum: 90 },
									lng: { type: 'number', minimum: -180, maximum: 180 },
									name: { type: 'string' },
									type: { type: 'string', enum: ['origin', 'destination', 'waypoint'] },
								},
							},
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { loadout_id, locations } = request.body;
			const userId = request.user.id;

			const client = await fastify.pg.connect();
			try {
				// Get loadout and build cargo profile
				const loadoutResult = await client.query(
					`SELECT l.*, array_agg(
						json_build_object(
							'id', ei.id,
							'category', ei.category,
							'platform', ei.platform,
							'ammunition_capacity', ei.ammunition_capacity,
							'nfa_subtype', ei.nfa_subtype
						)
					) as items
					FROM loadouts l
					LEFT JOIN loadout_items li ON l.id = li.loadout_id
					LEFT JOIN equipment_items ei ON li.equipment_item_id = ei.id
					WHERE l.id = $1 AND l.user_id = $2
					GROUP BY l.id`,
					[loadout_id, userId]
				);

				if (loadoutResult.rows.length === 0) {
					return reply.code(404).send({ error: 'Loadout not found' });
				}

				const loadout = loadoutResult.rows[0];
				const items = loadout.items.filter((item: any) => item.id !== null);

				// Build cargo profile from loadout
				const cargoProfile: CargoProfile = {
					has_firearms: items.some((item: any) => ['handgun', 'rifle', 'shotgun'].includes(item.category)),
					firearm_platforms: [...new Set(items.filter((item: any) => item.platform).map((item: any) => item.platform))],
					max_ammunition_capacity_by_platform: {
						handgun: Math.max(0, ...items.filter((item: any) => item.platform === 'handgun').map((item: any) => item.ammunition_capacity || 0)),
						rifle: Math.max(0, ...items.filter((item: any) => item.platform === 'rifle').map((item: any) => item.ammunition_capacity || 0)),
						shotgun: Math.max(0, ...items.filter((item: any) => item.platform === 'shotgun').map((item: any) => item.ammunition_capacity || 0)),
					},
					has_nfa_items: items.some((item: any) => item.category === 'nfa_item'),
					nfa_subtypes: [...new Set(items.filter((item: any) => item.nfa_subtype).map((item: any) => item.nfa_subtype))],
					has_concealed_carry_permit: false, // TODO: Get from user permits
					permit_states: [], // TODO: Get from user permits
					has_handgun: items.some((item: any) => item.category === 'handgun'),
					has_rifle: items.some((item: any) => item.category === 'rifle'),
					has_shotgun: items.some((item: any) => item.category === 'shotgun'),
					has_suppressor: items.some((item: any) => item.nfa_subtype === 'suppressor'),
					has_sbr: items.some((item: any) => item.nfa_subtype === 'sbr'),
					has_sbs: items.some((item: any) => item.nfa_subtype === 'sbs'),
					ammunition_capacity: Math.max(0, ...items.map((item: any) => item.ammunition_capacity || 0)),
				};

				// Validate each location
				const validationResults = [];
				for (const location of locations) {
					// Find jurisdictions at this location using PostGIS point-in-polygon
					const jurisdictionResult = await client.query(
						`SELECT j.id, j.name, j.postal_code, j.type
						FROM jurisdictions j
						WHERE j.geometry IS NOT NULL
						AND ST_Contains(j.geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))`,
						[location.lng, location.lat]
					);

					const jurisdictions = jurisdictionResult.rows;

					if (jurisdictions.length === 0) {
						// No jurisdiction found - use reverse geocoding or default to warning
						validationResults.push({
							location: location.name,
							type: location.type,
							coordinates: { lat: location.lat, lng: location.lng },
							jurisdictions: [],
							alerts: [{
								jurisdiction: 'Unknown',
								postal_code: 'UNK',
								severity: 'warning' as const,
								category: 'General',
								message: 'Unable to determine jurisdiction for compliance analysis.',
								citation: null,
							}],
							is_compliant: false,
						});
						continue;
					}

					// Get regulations for found jurisdictions
					const jurisdictionIds = jurisdictions.map(j => j.id);
					const regulationResult = await client.query(
						`SELECT r.*, j.name as jurisdiction_name, j.postal_code
						FROM regulations r
						JOIN jurisdictions j ON r.jurisdiction_id = j.id
						WHERE r.jurisdiction_id = ANY($1)`,
						[jurisdictionIds]
					);

					// Generate alerts for this location
					const { generateAlerts } = await import('../services/regulations.js');
					const alerts = generateAlerts(regulationResult.rows, cargoProfile);

					const criticalAlerts = alerts.filter(a => a.severity === 'critical');
					const isCompliant = criticalAlerts.length === 0;

					validationResults.push({
						location: location.name,
						type: location.type,
						coordinates: { lat: location.lat, lng: location.lng },
						jurisdictions: jurisdictions.map(j => ({ name: j.name, postal_code: j.postal_code, type: j.type })),
						alerts,
						is_compliant: isCompliant,
					});
				}

				// Generate suggested modifications if any location is non-compliant
				const nonCompliantLocations = validationResults.filter(r => !r.is_compliant);
				const suggestions = [];

				if (nonCompliantLocations.length > 0) {
					// Analyze common restriction types
					const allAlerts = nonCompliantLocations.flatMap(l => l.alerts);
					const magazineCapacityIssues = allAlerts.filter(a => a.category === 'magazine_capacity');
					const concealedCarryIssues = allAlerts.filter(a => a.category === 'concealed_carry');

					if (magazineCapacityIssues.length > 0) {
						const minCapacity = Math.min(...magazineCapacityIssues.map(a => a.details?.capacity_limit || 10));
						suggestions.push({
							type: 'reduce_capacity',
							description: `Consider using magazines with ${minCapacity} rounds or fewer`,
							impact: 'Will make your loadout compliant with all planned locations',
						});
					}

					if (concealedCarryIssues.length > 0) {
						suggestions.push({
							type: 'transport_method',
							description: 'Consider using locked case transport instead of concealed carry',
							impact: 'May avoid permit reciprocity issues in some jurisdictions',
						});
					}

					suggestions.push({
						type: 'route_planning',
						description: 'Consider alternative waypoints or destinations in more permissive jurisdictions',
						impact: 'May avoid restricted areas entirely during route planning',
					});
				}

				return {
					loadout_name: loadout.name,
					overall_compliance: nonCompliantLocations.length === 0,
					location_results: validationResults,
					suggested_modifications: suggestions,
					summary: {
						total_locations: locations.length,
						compliant_locations: validationResults.filter(r => r.is_compliant).length,
						non_compliant_locations: nonCompliantLocations.length,
						total_critical_alerts: validationResults.reduce((sum, r) => sum + r.alerts.filter(a => a.severity === 'critical').length, 0),
						total_warning_alerts: validationResults.reduce((sum, r) => sum + r.alerts.filter(a => a.severity === 'warning').length, 0),
					},
				};

			} catch (error) {
				const message = error instanceof Error ? error.message : 'Location validation failed';
				return reply.code(500).send({ error: message });
			} finally {
				client.release();
			}
		}
	);

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
						cargo_profile: {
							type: 'object',
							description: 'Cargo profile for regulation analysis',
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { origin, destination, waypoints, profile, avoid_polygons, cargo_profile } = request.body;

			try {
				const route = await calculateRoute({
					origin,
					destination,
					waypoints,
					profile,
					avoidPolygons: avoid_polygons,
				});

				// Always analyze route, even with empty profile, to get jurisdictions
				const profileToAnalyze: CargoProfile = cargo_profile || {
					has_firearms: false,
					firearm_platforms: [],
					max_ammunition_capacity_by_platform: {
						handgun: 0,
						rifle: 0,
						shotgun: 0
					},
					has_nfa_items: false,
					nfa_subtypes: [],
					has_concealed_carry_permit: false,
					permit_states: [],
					has_handgun: false,
					has_rifle: false,
					has_shotgun: false,
					has_suppressor: false,
					has_sbr: false,
					has_sbs: false,
				};

				let analysis;
				const client = await fastify.pg.connect();
				try {
					analysis = await analyzeRoute(client, route.geometry, profileToAnalyze);
				} finally {
					client.release();
				}

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
					analysis,
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
						loadout_id: { type: 'string', format: 'uuid' },
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
						cargo_profile: {
							type: 'object',
							description: 'Cargo profile for regulation analysis',
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { name, origin, destination, loadout_id, waypoints, profile, avoid_polygons, cargo_profile } = request.body;

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
						user_id, name, loadout_id,
						origin_name, origin_lat, origin_lng,
						destination_name, destination_lat, destination_lng,
						waypoints, route_geometry, route_metadata, cargo_profile
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
					RETURNING *`,
					[
						request.user.id,
						name,
						loadout_id || null,
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
						JSON.stringify(cargo_profile || null),
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

	// POST /calculate/reanalyze/:routeId - Re-analyze existing route with different loadout
	fastify.post(
		'/reanalyze/:routeId',
		{
			onRequest: [fastify.authenticate],
			schema: {
				params: {
					type: 'object',
					required: ['routeId'],
					properties: {
						routeId: { type: 'string', format: 'uuid' },
					},
				},
				body: {
					type: 'object',
					required: ['loadout_id'],
					properties: {
						loadout_id: { type: 'string', format: 'uuid' },
						update_route: { type: 'boolean', default: false },
					},
				},
			},
		},
		async (request, reply) => {
			const { routeId } = request.params;
			const { loadout_id, update_route = false } = request.body;
			const userId = request.user.id;

			const client = await fastify.pg.connect();
			try {
				// Get the existing route
				const routeResult = await client.query(
					`SELECT * FROM routes WHERE id = $1 AND user_id = $2`,
					[routeId, userId]
				);

				if (routeResult.rows.length === 0) {
					return reply.code(404).send({ error: 'Route not found' });
				}

				const route = routeResult.rows[0];

				// Get loadout and build cargo profile (reuse logic from validate-locations)
				const loadoutResult = await client.query(
					`SELECT l.*, array_agg(
						json_build_object(
							'id', ei.id,
							'category', ei.category,
							'platform', ei.platform,
							'ammunition_capacity', ei.ammunition_capacity,
							'nfa_subtype', ei.nfa_subtype
						)
					) as items
					FROM loadouts l
					LEFT JOIN loadout_items li ON l.id = li.loadout_id
					LEFT JOIN equipment_items ei ON li.equipment_item_id = ei.id
					WHERE l.id = $1 AND l.user_id = $2
					GROUP BY l.id`,
					[loadout_id, userId]
				);

				if (loadoutResult.rows.length === 0) {
					return reply.code(404).send({ error: 'Loadout not found' });
				}

				const loadout = loadoutResult.rows[0];
				const items = loadout.items.filter((item: any) => item.id !== null);

				// Build cargo profile from loadout
				const cargoProfile: CargoProfile = {
					has_firearms: items.some((item: any) => ['handgun', 'rifle', 'shotgun'].includes(item.category)),
					firearm_platforms: [...new Set(items.filter((item: any) => item.platform).map((item: any) => item.platform))],
					max_ammunition_capacity_by_platform: {
						handgun: Math.max(0, ...items.filter((item: any) => item.platform === 'handgun').map((item: any) => item.ammunition_capacity || 0)),
						rifle: Math.max(0, ...items.filter((item: any) => item.platform === 'rifle').map((item: any) => item.ammunition_capacity || 0)),
						shotgun: Math.max(0, ...items.filter((item: any) => item.platform === 'shotgun').map((item: any) => item.ammunition_capacity || 0)),
					},
					has_nfa_items: items.some((item: any) => item.category === 'nfa_item'),
					nfa_subtypes: [...new Set(items.filter((item: any) => item.nfa_subtype).map((item: any) => item.nfa_subtype))],
					has_concealed_carry_permit: false, // TODO: Get from user permits
					permit_states: [], // TODO: Get from user permits
					has_handgun: items.some((item: any) => item.category === 'handgun'),
					has_rifle: items.some((item: any) => item.category === 'rifle'),
					has_shotgun: items.some((item: any) => item.category === 'shotgun'),
					has_suppressor: items.some((item: any) => item.nfa_subtype === 'suppressor'),
					has_sbr: items.some((item: any) => item.nfa_subtype === 'sbr'),
					has_sbs: items.some((item: any) => item.nfa_subtype === 'sbs'),
					ammunition_capacity: Math.max(0, ...items.map((item: any) => item.ammunition_capacity || 0)),
				};

				// Re-analyze the route with the new cargo profile
				const analysis = await analyzeRoute(client, route.route_geometry, cargoProfile);

				// Optionally update the route in database
				if (update_route) {
					await client.query(
						`UPDATE routes 
						SET loadout_id = $1, cargo_profile = $2, regulation_alerts = $3, updated_at = CURRENT_TIMESTAMP
						WHERE id = $4 AND user_id = $5`,
						[loadout_id, JSON.stringify(cargoProfile), JSON.stringify(analysis.alerts), routeId, userId]
					);
				}

				return {
					route_id: routeId,
					route_name: route.name,
					previous_loadout_id: route.loadout_id,
					new_loadout_id: loadout_id,
					new_loadout_name: loadout.name,
					updated_in_database: update_route,
					analysis,
					comparison: {
						previous_alerts: route.regulation_alerts ? route.regulation_alerts.length : 0,
						new_alerts: analysis.alerts.length,
						alert_difference: analysis.alerts.length - (route.regulation_alerts ? route.regulation_alerts.length : 0),
					},
				};

			} catch (error) {
				const message = error instanceof Error ? error.message : 'Route re-analysis failed';
				return reply.code(500).send({ error: message });
			} finally {
				client.release();
			}
		}
	);
}

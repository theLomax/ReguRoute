/**
 * Advanced routing service that integrates regulation analysis with multi-route generation
 * Builds on existing ORS and regulations services to provide compliance-aware routing
 */

import type { PoolClient } from 'pg';
import { calculateRoute, type RouteRequest, type RouteResult, type Coordinate } from './ors.js';
import { getAvoidancePolygons, analyzeRoute, type CargoProfile, type RouteAnalysis } from './regulations.js';

export interface RouteOptions {
	preference: 'compliant' | 'fast' | 'balanced';
	avoid_states?: string[];
	max_detour_minutes?: number;
	generate_alternatives?: boolean;
}

export interface ScoredRoute {
	route: RouteResult;
	analysis: RouteAnalysis;
	scores: {
		compliance_score: number;    // 0-100 (higher = more compliant)
		efficiency_score: number;    // 0-100 (higher = faster/shorter)
		overall_score: number;       // Weighted combination
	};
	metadata: {
		route_type: 'most_compliant' | 'fastest' | 'balanced' | 'alternative';
		detour_minutes: number;
		detour_percentage: number;
		avoidance_used: boolean;
		restricted_states_avoided: string[];
	};
}

export interface MultiRouteResponse {
	routes: ScoredRoute[];
	recommendation: {
		recommended_route_index: number;
		reason: string;
		compliance_summary: string;
	};
	analysis_summary: {
		total_routes: number;
		compliant_routes: number;
		fastest_route_index: number;
		most_compliant_route_index: number;
	};
}

/**
 * Generate multiple route alternatives with compliance scoring
 */
export async function generateRouteAlternatives(
	client: PoolClient,
	origin: Coordinate,
	destination: Coordinate,
	cargoProfile: CargoProfile,
	options: RouteOptions = { preference: 'balanced' }
): Promise<MultiRouteResponse> {
	const routes: ScoredRoute[] = [];
	
	// Step 1: Get avoidance polygons based on cargo profile
	const { avoidPolygons, restrictedJurisdictions } = await getAvoidancePolygons(client, cargoProfile);
	
	// Step 2: Generate base routes
	try {
		// Route 1: Fastest route (no avoidance)
		const fastestRoute = await calculateRoute({
			origin,
			destination,
			profile: 'driving-car',
		});
		
		const fastestAnalysis = await analyzeRoute(client, fastestRoute.geometry, cargoProfile);
		
		routes.push({
			route: fastestRoute,
			analysis: fastestAnalysis,
			scores: calculateRouteScore(fastestRoute, fastestAnalysis, 'fast'),
			metadata: {
				route_type: 'fastest',
				detour_minutes: 0,
				detour_percentage: 0,
				avoidance_used: false,
				restricted_states_avoided: [],
			},
		});

		// Route 2: Most compliant route (with avoidance if needed)
		if (avoidPolygons && restrictedJurisdictions.length > 0) {
			try {
				const compliantRoute = await calculateRoute({
					origin,
					destination,
					profile: 'driving-car',
					avoidPolygons,
				});
				
				const compliantAnalysis = await analyzeRoute(client, compliantRoute.geometry, cargoProfile);
				const detourMinutes = (compliantRoute.summary.duration - fastestRoute.summary.duration) / 60;
				const detourPercentage = (detourMinutes / (fastestRoute.summary.duration / 60)) * 100;
				
				routes.push({
					route: compliantRoute,
					analysis: compliantAnalysis,
					scores: calculateRouteScore(compliantRoute, compliantAnalysis, 'compliant'),
					metadata: {
						route_type: 'most_compliant',
						detour_minutes: Math.round(detourMinutes),
						detour_percentage: Math.round(detourPercentage * 10) / 10,
						avoidance_used: true,
						restricted_states_avoided: restrictedJurisdictions.map(j => j.postal_code),
					},
				});
			} catch (error) {
				console.warn('Could not generate compliant route with full avoidance:', error);
			}
		}

		// Route 3: Balanced route (partial avoidance of only critical restrictions)
		if (options.generate_alternatives && restrictedJurisdictions.length > 0) {
			try {
				// Create partial avoidance polygon for only the most restricted areas
				const criticalJurisdictions = restrictedJurisdictions.filter(j => 
					j.reasons.some(reason => 
						reason.includes('capacity exceeds') || 
						reason.includes('permit not recognized')
					)
				);

				if (criticalJurisdictions.length > 0 && criticalJurisdictions.length < restrictedJurisdictions.length) {
					// Get avoidance polygons for only critical jurisdictions
					const partialAvoidance = await getPartialAvoidancePolygons(client, cargoProfile, criticalJurisdictions);
					
					if (partialAvoidance) {
						const balancedRoute = await calculateRoute({
							origin,
							destination,
							profile: 'driving-car',
							avoidPolygons: partialAvoidance,
						});
						
						const balancedAnalysis = await analyzeRoute(client, balancedRoute.geometry, cargoProfile);
						const detourMinutes = (balancedRoute.summary.duration - fastestRoute.summary.duration) / 60;
						const detourPercentage = (detourMinutes / (fastestRoute.summary.duration / 60)) * 100;
						
						routes.push({
							route: balancedRoute,
							analysis: balancedAnalysis,
							scores: calculateRouteScore(balancedRoute, balancedAnalysis, 'balanced'),
							metadata: {
								route_type: 'balanced',
								detour_minutes: Math.round(detourMinutes),
								detour_percentage: Math.round(detourPercentage * 10) / 10,
								avoidance_used: true,
								restricted_states_avoided: criticalJurisdictions.map(j => j.postal_code),
							},
						});
					}
				}
			} catch (error) {
				console.warn('Could not generate balanced route:', error);
			}
		}

	} catch (error) {
		throw new Error(`Failed to generate route alternatives: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	// Step 3: Filter out invalid routes and sort by overall score
	const validRoutes = routes.filter(r => r.route && r.analysis).sort((a, b) => b.scores.overall_score - a.scores.overall_score);
	
	if (validRoutes.length === 0) {
		throw new Error('No valid routes could be generated');
	}

	// Step 4: Generate recommendation
	const fastestIndex = validRoutes.findIndex(r => r.metadata.route_type === 'fastest');
	const mostCompliantIndex = validRoutes.findIndex(r => 
		r.analysis.alerts.filter(a => a.severity === 'critical').length === 0
	);

	let recommendedIndex = 0;
	let reason = 'Best overall balance of speed and compliance';
	
	switch (options.preference) {
		case 'fast':
			recommendedIndex = fastestIndex >= 0 ? fastestIndex : 0;
			reason = 'Fastest available route';
			break;
		case 'compliant':
			recommendedIndex = mostCompliantIndex >= 0 ? mostCompliantIndex : 0;
			reason = 'Most compliant route available';
			break;
		default: // balanced
			// Prefer highest overall score
			recommendedIndex = 0;
			break;
	}

	// Step 5: Generate compliance summary
	const recommendedRoute = validRoutes[recommendedIndex];
	const criticalAlerts = recommendedRoute.analysis.alerts.filter(a => a.severity === 'critical').length;
	const warningAlerts = recommendedRoute.analysis.alerts.filter(a => a.severity === 'warning').length;
	
	let complianceSummary = '';
	if (criticalAlerts === 0 && warningAlerts === 0) {
		complianceSummary = 'No compliance issues detected';
	} else if (criticalAlerts === 0) {
		complianceSummary = `${warningAlerts} warnings - review transport requirements`;
	} else {
		complianceSummary = `${criticalAlerts} critical issues - consider alternative route or modify equipment`;
	}

	return {
		routes: validRoutes,
		recommendation: {
			recommended_route_index: recommendedIndex,
			reason,
			compliance_summary: complianceSummary,
		},
		analysis_summary: {
			total_routes: validRoutes.length,
			compliant_routes: validRoutes.filter(r => r.analysis.alerts.filter(a => a.severity === 'critical').length === 0).length,
			fastest_route_index: fastestIndex >= 0 ? fastestIndex : 0,
			most_compliant_route_index: mostCompliantIndex >= 0 ? mostCompliantIndex : 0,
		},
	};
}

/**
 * Calculate route score based on compliance and efficiency factors
 */
function calculateRouteScore(
	route: RouteResult,
	analysis: RouteAnalysis,
	routeType: 'fast' | 'compliant' | 'balanced'
): { compliance_score: number; efficiency_score: number; overall_score: number } {
	
	// Compliance scoring (0-100, higher is better)
	const criticalAlerts = analysis.alerts.filter(a => a.severity === 'critical').length;
	const warningAlerts = analysis.alerts.filter(a => a.severity === 'warning').length;
	const infoAlerts = analysis.alerts.filter(a => a.severity === 'info').length;
	
	// Start at 100 and deduct points for issues
	let complianceScore = 100;
	complianceScore -= criticalAlerts * 50;  // Critical issues are major penalties
	complianceScore -= warningAlerts * 15;   // Warnings are moderate penalties
	complianceScore -= infoAlerts * 5;       // Info alerts are minor penalties
	complianceScore = Math.max(0, complianceScore);

	// Efficiency scoring (0-100, higher is better)
	// Based on duration (primary) and distance (secondary)
	// We'll normalize against typical values - assume 8 hours (480 min) and 500 miles as reference
	const durationMinutes = route.summary.duration / 60;
	const distanceMiles = route.summary.distance / 1609.34;
	
	const durationScore = Math.max(0, 100 - (durationMinutes / 480) * 60);  // 60% weight on duration
	const distanceScore = Math.max(0, 100 - (distanceMiles / 500) * 40);     // 40% weight on distance
	const efficiencyScore = Math.max(0, durationScore + distanceScore);

	// Overall score with weights based on route type
	let complianceWeight = 0.6;  // Default balanced
	let efficiencyWeight = 0.4;

	switch (routeType) {
		case 'fast':
			complianceWeight = 0.3;
			efficiencyWeight = 0.7;
			break;
		case 'compliant':
			complianceWeight = 0.8;
			efficiencyWeight = 0.2;
			break;
		default: // balanced
			complianceWeight = 0.6;
			efficiencyWeight = 0.4;
			break;
	}

	const overallScore = (complianceScore * complianceWeight) + (efficiencyScore * efficiencyWeight);

	return {
		compliance_score: Math.round(complianceScore),
		efficiency_score: Math.round(efficiencyScore),
		overall_score: Math.round(overallScore),
	};
}

/**
 * Generate avoidance polygons for only the specified critical jurisdictions
 */
async function getPartialAvoidancePolygons(
	client: PoolClient,
	cargoProfile: CargoProfile,
	criticalJurisdictions: Array<{ name: string; postal_code: string; reasons: string[] }>
): Promise<GeoJSON.MultiPolygon | null> {
	
	if (criticalJurisdictions.length === 0) {
		return null;
	}

	// Get geometries for only the critical jurisdictions
	const postalCodes = criticalJurisdictions.map(j => j.postal_code);
	
	const query = `
		SELECT ST_AsGeoJSON(j.geometry)::json as geometry
		FROM jurisdictions j
		WHERE j.postal_code = ANY($1)
			AND j.type = 'state'
			AND j.geometry IS NOT NULL
	`;

	const result = await client.query(query, [postalCodes]);

	if (result.rows.length === 0) {
		return null;
	}

	// Build MultiPolygon from critical jurisdiction geometries
	const polygons: GeoJSON.Polygon[] = [];

	for (const row of result.rows) {
		const geometry = row.geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon;

		// Extract polygons from geometry (could be Polygon or MultiPolygon)
		if (geometry.type === 'Polygon') {
			polygons.push(geometry);
		} else if (geometry.type === 'MultiPolygon') {
			for (const coords of geometry.coordinates) {
				polygons.push({
					type: 'Polygon',
					coordinates: coords,
				});
			}
		}
	}

	if (polygons.length === 0) {
		return null;
	}

	// Combine all polygons into a single MultiPolygon
	return {
		type: 'MultiPolygon',
		coordinates: polygons.map((p) => p.coordinates),
	};
}
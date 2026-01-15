/**
 * Regulation Analysis Service
 * Analyzes routes against jurisdiction regulations to generate compliance alerts
 */

import type { PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Write to src directory so it syncs to host via volume mount
// Write to src directory so it syncs to host via volume mount
const LOG_FILE = '/usr/src/app/apps/backend/src/debug_regulations.log';

function logToFile(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
    try {
        fs.appendFileSync(LOG_FILE, logLine);
    } catch (e) {
        // ignore logging errors
    }
}

import type { CargoProfile } from '@reguroute/types';
export type { CargoProfile };

export interface JurisdictionRegulation {
	jurisdiction_id: string;
	jurisdiction_name: string;
	postal_code: string;
	category: string;
	is_restricted: boolean;
	restriction_level: number;
	permit_required: boolean;
	magazine_capacity_limit: number | null;
	minimum_age: number | null;
	waiting_period_days: number | null;
	transport_requirements: Record<string, unknown>;
	statutory_citation: string | null;
	notes: string | null;
}

export interface RegulationAlert {
	jurisdiction: string;
	postal_code: string;
	severity: 'info' | 'warning' | 'critical';
	category: string;
	message: string;
	requirements?: Record<string, unknown>;
	citation?: string;
}

export interface RouteAnalysis {
	jurisdictions_crossed: string[];
	alerts: RegulationAlert[];
	summary: {
		total_jurisdictions: number;
		critical_alerts: number;
		warning_alerts: number;
		info_alerts: number;
	};
}

/**
 * Find jurisdictions that a route passes through using PostGIS
 * Takes a GeoJSON LineString and finds intersecting state boundaries
 */
export async function findJurisdictionsOnRoute(
	client: PoolClient,
	routeGeometry: GeoJSON.LineString
): Promise<Array<{ id: string; name: string; postal_code: string }>> {
	// Convert GeoJSON to PostGIS geometry and find intersecting jurisdictions
	const result = await client.query(
		`SELECT id, name, postal_code
		 FROM jurisdictions
		 WHERE type = 'state'
		   AND geometry IS NOT NULL
		   AND ST_Intersects(
		     geometry,
		     ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
		   )
		 ORDER BY name`,
		[JSON.stringify(routeGeometry)]
	);

	return result.rows;
}

/**
 * Get all regulations for a list of jurisdiction IDs
 */
export async function getRegulationsForJurisdictions(
	client: PoolClient,
	jurisdictionIds: string[]
): Promise<JurisdictionRegulation[]> {
	if (jurisdictionIds.length === 0) return [];

	const result = await client.query(
		`SELECT
		   r.jurisdiction_id,
		   j.name as jurisdiction_name,
		   j.postal_code,
		   r.category,
		   r.is_restricted,
		   r.restriction_level,
		   r.permit_required,
		   r.magazine_capacity_limit,
		   r.minimum_age,
		   r.waiting_period_days,
		   r.transport_requirements,
		   r.statutory_citation,
		   r.notes
		 FROM regulations r
		 JOIN jurisdictions j ON r.jurisdiction_id = j.id
		 WHERE r.jurisdiction_id = ANY($1)
		 ORDER BY j.name, r.restriction_level DESC`,
		[jurisdictionIds]
	);

	return result.rows;
}

/**
 * Generate alerts based on regulations and cargo profile
 */

export function generateAlerts(
	regulations: JurisdictionRegulation[],
	cargoProfile: CargoProfile
): RegulationAlert[] {
	const alerts: RegulationAlert[] = [];
    
    logToFile('generateAlerts called with:', { 
        cargoProfile, 
        regulationsCount: regulations.length,
        regulationsSummary: regulations.map(r => `${r.jurisdiction_name}:${r.category}:${r.magazine_capacity_limit}`)
    });

	if (!cargoProfile.has_firearms) {
        logToFile('No firearms in profile, returning empty alerts');
		return alerts; // No firearms, no alerts needed
	}

	console.log('--- Generating Alerts ---');
	console.log('Cargo Profile Capacity:', cargoProfile.ammunition_capacity);
	console.log('Regulations Found:', regulations.length);

	for (const reg of regulations) {
		// console.log(`Checking ${reg.jurisdiction_name} ${reg.category}`, reg);

        // Debug specific checks
        if (reg.category === 'magazine_capacity') {
            logToFile(`Checking magazine capacity for ${reg.jurisdiction_name}`, {
                limit: reg.magazine_capacity_limit,
                profileCapacity: cargoProfile.ammunition_capacity,
                isRestricted: reg.is_restricted,
                willAlert: (cargoProfile.ammunition_capacity || 0) > (reg.magazine_capacity_limit || 999)
            });
        }

		// Check concealed carry requirements
		if (reg.category === 'concealed_carry' && reg.is_restricted) {
			if (reg.permit_required && !cargoProfile.has_concealed_carry_permit) {
				alerts.push({
					jurisdiction: reg.jurisdiction_name,
					postal_code: reg.postal_code,
					severity: reg.restriction_level >= 7 ? 'critical' : 'warning',
					category: 'Concealed Carry',
					message: `${reg.jurisdiction_name} requires a concealed carry permit. Your permit may not be recognized.`,
					citation: reg.statutory_citation || undefined,
				});
			}
		}

		// Check ammunition capacity limits (magazine, tube, cylinder, etc.)
		if (
			reg.category === 'magazine_capacity' &&
			reg.magazine_capacity_limit &&
			cargoProfile.ammunition_capacity
		) {
			if (cargoProfile.ammunition_capacity > reg.magazine_capacity_limit) {
				alerts.push({
					jurisdiction: reg.jurisdiction_name,
					postal_code: reg.postal_code,
					severity: 'critical',
					category: 'Ammunition Capacity',
					message: `${reg.jurisdiction_name} limits ammunition capacity to ${reg.magazine_capacity_limit} rounds. Your ${cargoProfile.ammunition_capacity}-round capacity exceeds the limit.`,
					citation: reg.statutory_citation || undefined,
				});
			}
		}

		// Note: Assault weapons regulations are state-specific and variable
		// TODO: Implement assault weapon classification logic based on state definitions
		// For now, this check is disabled until we have proper state-specific rules

		// Check vehicle transport requirements
		if (
			reg.category === 'vehicle_carry' &&
			reg.transport_requirements &&
			Object.keys(reg.transport_requirements).length > 0
		) {
			const reqs = reg.transport_requirements as Record<string, boolean>;
			const reqMessages: string[] = [];

			if (reqs.must_be_unloaded) reqMessages.push('unloaded');
			if (reqs.must_be_locked) reqMessages.push('in a locked container');
			if (reqs.must_be_in_trunk) reqMessages.push('stored in trunk');
			if (reqs.separate_ammo) reqMessages.push('ammunition stored separately');

			if (reqMessages.length > 0) {
				alerts.push({
					jurisdiction: reg.jurisdiction_name,
					postal_code: reg.postal_code,
					severity: 'warning',
					category: 'Transport Requirements',
					message: `${reg.jurisdiction_name} requires firearms be transported ${reqMessages.join(', ')}.`,
					requirements: reg.transport_requirements,
					citation: reg.statutory_citation || undefined,
				});
			}
		}

		// Check open carry restrictions
		if (reg.category === 'open_carry' && reg.is_restricted) {
			alerts.push({
				jurisdiction: reg.jurisdiction_name,
				postal_code: reg.postal_code,
				severity: reg.restriction_level >= 7 ? 'warning' : 'info',
				category: 'Open Carry',
				message: `${reg.jurisdiction_name} restricts or prohibits open carry of firearms.`,
				citation: reg.statutory_citation || undefined,
			});
		}

		// Check registration requirements
		if (reg.category === 'registration' && reg.is_restricted) {
			alerts.push({
				jurisdiction: reg.jurisdiction_name,
				postal_code: reg.postal_code,
				severity: 'info',
				category: 'Registration',
				message: `${reg.jurisdiction_name} requires firearm registration. Travelers may need to comply.`,
				citation: reg.statutory_citation || undefined,
			});
		}
	}

	// Sort alerts by severity (critical first)
	const severityOrder = { critical: 0, warning: 1, info: 2 };
	alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

	return alerts;
}

/**
 * Main function: Analyze a route against regulations
 */
export async function analyzeRoute(
	client: PoolClient,
	routeGeometry: GeoJSON.LineString,
	cargoProfile: CargoProfile
): Promise<RouteAnalysis> {
	// Find jurisdictions the route passes through
	const jurisdictions = await findJurisdictionsOnRoute(client, routeGeometry);
    
    logToFile('analyzeRoute jurisdictions found:', jurisdictions);

	if (jurisdictions.length === 0) {
		// No jurisdictions with geometry data found - fall back to basic response
		return {
			jurisdictions_crossed: [],
			alerts: [],
			summary: {
				total_jurisdictions: 0,
				critical_alerts: 0,
				warning_alerts: 0,
				info_alerts: 0,
			},
		};
	}

	// Get regulations for those jurisdictions
	const jurisdictionIds = jurisdictions.map((j) => j.id);
	const regulations = await getRegulationsForJurisdictions(client, jurisdictionIds);

	// Generate alerts based on cargo profile
	const alerts = generateAlerts(regulations, cargoProfile);
    
    logToFile('analyzeRoute generated alerts:', alerts);

	return {
		jurisdictions_crossed: jurisdictions.map((j) => `${j.name} (${j.postal_code})`),
		alerts,
		summary: {
			total_jurisdictions: jurisdictions.length,
			critical_alerts: alerts.filter((a) => a.severity === 'critical').length,
			warning_alerts: alerts.filter((a) => a.severity === 'warning').length,
			info_alerts: alerts.filter((a) => a.severity === 'info').length,
		},
	};
}

/**
 * Get avoidance polygons for jurisdictions that have restrictions based on cargo profile
 * Returns a GeoJSON MultiPolygon that can be passed to ORS to avoid restricted areas
 */
export async function getAvoidancePolygons(
	client: PoolClient,
	cargoProfile: CargoProfile
): Promise<{
	avoidPolygons: GeoJSON.MultiPolygon | null;
	restrictedJurisdictions: Array<{
		name: string;
		postal_code: string;
		reasons: string[];
		citations: string[];
	}>;
}> {
	// If no firearms, no restrictions apply
	if (!cargoProfile.has_firearms) {
		return { avoidPolygons: null, restrictedJurisdictions: [] };
	}

	// Build conditions for restricted jurisdictions based on cargo profile
	const conditions: string[] = [];
	const params: unknown[] = [];
	let paramIndex = 1;

	// Critical restrictions that warrant route avoidance:

	// 1. Ammunition capacity limits - if user's capacity exceeds state limit
	if (cargoProfile.ammunition_capacity) {
		conditions.push(
			`(r.category = 'magazine_capacity' AND r.magazine_capacity_limit IS NOT NULL AND r.magazine_capacity_limit < $${paramIndex})`
		);
		params.push(cargoProfile.ammunition_capacity);
		paramIndex++;
	}

	// Note: Assault weapons avoidance is disabled until we have state-specific definitions
	// TODO: Implement assault weapon classification based on state-specific rules

	// 3. Concealed carry restrictions
	if (!cargoProfile.has_concealed_carry_permit) {
		// No permit - avoid states requiring permits for concealed carry
		conditions.push(
			`(r.category = 'concealed_carry' AND r.permit_required = true AND r.is_restricted = true AND r.restriction_level >= 7)`
		);
	}

	if (conditions.length === 0) {
		return { avoidPolygons: null, restrictedJurisdictions: [] };
	}

	// Query for restricted jurisdictions with their geometries
	const query = `
		SELECT DISTINCT ON (j.id)
			j.id,
			j.name,
			j.postal_code,
			ST_AsGeoJSON(j.geometry)::json as geometry,
			array_agg(DISTINCT r.category) as categories,
			array_agg(DISTINCT r.statutory_citation) FILTER (WHERE r.statutory_citation IS NOT NULL) as citations
		FROM jurisdictions j
		JOIN regulations r ON r.jurisdiction_id = j.id
		WHERE j.type = 'state'
			AND j.geometry IS NOT NULL
			AND (${conditions.join(' OR ')})
		GROUP BY j.id, j.name, j.postal_code, j.geometry
		ORDER BY j.id, j.name
	`;

	const result = await client.query(query, params);

	if (result.rows.length === 0) {
		return { avoidPolygons: null, restrictedJurisdictions: [] };
	}

	// Build MultiPolygon from all restricted jurisdiction geometries
	const polygons: GeoJSON.Polygon[] = [];
	const restrictedJurisdictions: Array<{
		name: string;
		postal_code: string;
		reasons: string[];
		citations: string[];
	}> = [];

	for (const row of result.rows) {
		const geometry = row.geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon;

		// Build human-readable reasons
		const reasons: string[] = [];
		for (const category of row.categories) {
			switch (category) {
				case 'magazine_capacity':
					reasons.push('Ammunition capacity exceeds state limit');
					break;
				case 'concealed_carry':
					reasons.push('Concealed carry permit not recognized');
					break;
			}
		}

		restrictedJurisdictions.push({
			name: row.name,
			postal_code: row.postal_code,
			reasons,
			citations: row.citations || [],
		});

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

	// Combine all polygons into a single MultiPolygon
	const avoidPolygons: GeoJSON.MultiPolygon = {
		type: 'MultiPolygon',
		coordinates: polygons.map((p) => p.coordinates),
	};

	return { avoidPolygons, restrictedJurisdictions };
}

/**
 * Analyze a route by postal codes (fallback when no geometry data)
 * Takes an array of state postal codes the route passes through
 */
export async function analyzeRouteByStates(
	client: PoolClient,
	postalCodes: string[],
	cargoProfile: CargoProfile
): Promise<RouteAnalysis> {
	if (postalCodes.length === 0) {
		return {
			jurisdictions_crossed: [],
			alerts: [],
			summary: {
				total_jurisdictions: 0,
				critical_alerts: 0,
				warning_alerts: 0,
				info_alerts: 0,
			},
		};
	}

	// Get jurisdictions by postal code
	const jurisdictionResult = await client.query(
		`SELECT id, name, postal_code
		 FROM jurisdictions
		 WHERE type = 'state' AND postal_code = ANY($1)
		 ORDER BY name`,
		[postalCodes]
	);

	const jurisdictions = jurisdictionResult.rows;

	if (jurisdictions.length === 0) {
		return {
			jurisdictions_crossed: [],
			alerts: [],
			summary: {
				total_jurisdictions: 0,
				critical_alerts: 0,
				warning_alerts: 0,
				info_alerts: 0,
			},
		};
	}

	// Get regulations for those jurisdictions
	const jurisdictionIds = jurisdictions.map((j: { id: string }) => j.id);
	const regulations = await getRegulationsForJurisdictions(client, jurisdictionIds);

	// Generate alerts based on cargo profile
	const alerts = generateAlerts(regulations, cargoProfile);

	return {
		jurisdictions_crossed: jurisdictions.map(
			(j: { name: string; postal_code: string }) => `${j.name} (${j.postal_code})`
		),
		alerts,
		summary: {
			total_jurisdictions: jurisdictions.length,
			critical_alerts: alerts.filter((a) => a.severity === 'critical').length,
			warning_alerts: alerts.filter((a) => a.severity === 'warning').length,
			info_alerts: alerts.filter((a) => a.severity === 'info').length,
		},
	};
}

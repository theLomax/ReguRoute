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

/**
 * Utility functions for date handling in regulations
 */

// Format date for human display (e.g., "January 2013" or "September 2022")
export function formatRegulationDate(dateString: string | null): string | null {
	if (!dateString) return null;
	
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return null;
	
	return date.toLocaleDateString('en-US', { 
		year: 'numeric', 
		month: 'long' 
	});
}

// Check if a regulation is potentially outdated (last verified > 1 year ago)
export function isRegulationStale(lastVerified: string | null): boolean {
	if (!lastVerified) return true;
	
	const verifiedDate = new Date(lastVerified);
	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
	
	return verifiedDate < oneYearAgo;
}

// Calculate regulation age in years
export function getRegulationAge(effectiveDate: string | null): number | null {
	if (!effectiveDate) return null;
	
	const enactedDate = new Date(effectiveDate);
	const now = new Date();
	const diffTime = now.getTime() - enactedDate.getTime();
	const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
	
	return Math.floor(diffYears);
}

// Get all stale regulations that need verification (last verified > threshold days)
export async function getStaleRegulations(
	client: PoolClient, 
	thresholdDays: number = 365
): Promise<Array<{
	jurisdiction_name: string;
	postal_code: string;
	category: string;
	last_verified: string;
	days_since_verified: number;
	statutory_citation: string;
}>> {
	const result = await client.query(`
		SELECT 
			j.name as jurisdiction_name,
			j.postal_code,
			r.category,
			r.last_verified,
			EXTRACT(days FROM (CURRENT_DATE - r.last_verified::date)) as days_since_verified,
			r.statutory_citation
		FROM regulations r
		JOIN jurisdictions j ON r.jurisdiction_id = j.id
		WHERE j.type = 'state' 
			AND r.last_verified IS NOT NULL
			AND r.last_verified < (CURRENT_DATE - INTERVAL '${thresholdDays} days')
		ORDER BY r.last_verified ASC
	`);

	return result.rows.map(row => ({
		...row,
		days_since_verified: parseInt(row.days_since_verified)
	}));
}

// Get data quality summary for monitoring
export async function getDataQualitySummary(client: PoolClient): Promise<{
	total_regulations: number;
	recent_verifications: number;
	with_effective_dates: number;
	with_specific_citations: number;
	stale_regulations: number;
	verification_freshness_pct: number;
	effective_date_completeness_pct: number;
	citation_specificity_pct: number;
}> {
	const queries = {
		total: `
			SELECT COUNT(*) as count 
			FROM regulations r
			JOIN jurisdictions j ON r.jurisdiction_id = j.id
			WHERE j.type = 'state'
		`,
		recent_verifications: `
			SELECT COUNT(*) as count 
			FROM regulations r
			JOIN jurisdictions j ON r.jurisdiction_id = j.id
			WHERE j.type = 'state'
				AND r.last_verified >= (CURRENT_DATE - INTERVAL '6 months')
		`,
		with_effective_dates: `
			SELECT COUNT(*) as count 
			FROM regulations r
			JOIN jurisdictions j ON r.jurisdiction_id = j.id
			WHERE j.type = 'state'
				AND r.effective_date IS NOT NULL
		`,
		with_specific_citations: `
			SELECT COUNT(*) as count 
			FROM regulations r
			JOIN jurisdictions j ON r.jurisdiction_id = j.id
			WHERE j.type = 'state'
				AND r.statutory_citation IS NOT NULL
				AND r.statutory_citation NOT IN ('State law', 'Federal law', 'N/A')
		`,
		stale_regulations: `
			SELECT COUNT(*) as count 
			FROM regulations r
			JOIN jurisdictions j ON r.jurisdiction_id = j.id
			WHERE j.type = 'state'
				AND r.last_verified IS NOT NULL
				AND r.last_verified < (CURRENT_DATE - INTERVAL '1 year')
		`
	};

	const results = await Promise.all([
		client.query(queries.total),
		client.query(queries.recent_verifications),
		client.query(queries.with_effective_dates),
		client.query(queries.with_specific_citations),
		client.query(queries.stale_regulations)
	]);

	const total = parseInt(results[0].rows[0].count);
	const recent = parseInt(results[1].rows[0].count);
	const dated = parseInt(results[2].rows[0].count);
	const specific = parseInt(results[3].rows[0].count);
	const stale = parseInt(results[4].rows[0].count);

	return {
		total_regulations: total,
		recent_verifications: recent,
		with_effective_dates: dated,
		with_specific_citations: specific,
		stale_regulations: stale,
		verification_freshness_pct: Math.round((recent / total) * 100),
		effective_date_completeness_pct: Math.round((dated / total) * 100),
		citation_specificity_pct: Math.round((specific / total) * 100)
	};
}

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
	rule_definition: Record<string, unknown> | null;
	effective_date: string | null;
	last_verified: string | null;
	database_updated_at: string | null;
}

export interface RegulationAlert {
	jurisdiction: string;
	postal_code: string;
	severity: 'info' | 'warning' | 'critical';
	category: string;
	message: string;
	requirements?: Record<string, unknown>;
	citation?: string | null;
	details?: Record<string, unknown>;
	effective_date?: string | null;
	effective_date_formatted?: string | null;
	last_verified?: string | null;
	is_stale?: boolean;
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
): Promise<Array<{ id: string; name: string; postal_code: string; route_position: number }>> {
	// Convert GeoJSON to PostGIS geometry and find intersecting jurisdictions
	const result = await client.query(
		`WITH route_line AS (
		   SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom
		 ),
		 route_points AS (
		   SELECT 
		     ST_StartPoint(geom) AS start_point,
		     ST_EndPoint(geom) AS end_point,
		     geom AS route_geom
		   FROM route_line
		 ),
		 intersections AS (
		   -- States intersected by the route line
		   SELECT 
		     j.id, j.name, j.postal_code,
		     ST_LineLocatePoint(rp.route_geom, ST_ClosestPoint(rp.route_geom, ST_Centroid(j.geometry))) AS route_position
		   FROM jurisdictions j, route_points rp
		   WHERE j.type = 'state'
		     AND j.geometry IS NOT NULL
		     AND ST_Intersects(j.geometry, rp.route_geom)
		   
		   UNION
		   
		   -- Origin state (contains start point)
		   SELECT 
		     j.id, j.name, j.postal_code,
		     0.0 AS route_position
		   FROM jurisdictions j, route_points rp
		   WHERE j.type = 'state'
		     AND j.geometry IS NOT NULL
		     AND ST_Contains(j.geometry, rp.start_point)
		   
		   UNION
		   
		   -- Destination state (contains end point)
		   SELECT 
		     j.id, j.name, j.postal_code,
		     1.0 AS route_position
		   FROM jurisdictions j, route_points rp
		   WHERE j.type = 'state'
		     AND j.geometry IS NOT NULL
		     AND ST_Contains(j.geometry, rp.end_point)
		 )
		 SELECT id, name, postal_code, MIN(route_position) as route_position
		 FROM intersections
		 GROUP BY id, name, postal_code
		 ORDER BY route_position`,
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
		   r.notes,
		   r.rule_definition,
		   r.effective_date,
		   r.last_verified,
		   r.database_updated_at
		 FROM regulations r
		 JOIN jurisdictions j ON r.jurisdiction_id = j.id
		 WHERE r.jurisdiction_id = ANY($1)
		 ORDER BY j.name, r.restriction_level DESC`,
		[jurisdictionIds]
	);

	return result.rows;
}

/**
 * Evaluate rule-based compliance using JSONB rule definitions
 */
function evaluateRuleBasedCompliance(
	reg: JurisdictionRegulation,
	cargoProfile: CargoProfile
): RegulationAlert[] {
	const alerts: RegulationAlert[] = [];

	if (!reg.rule_definition || typeof reg.rule_definition !== 'object') {
		return alerts;
	}

	const rule = reg.rule_definition as any;

	// For now, simulate equipment items based on cargo profile
	// In a full implementation, this would get actual equipment items with features
	const simulatedEquipment = createSimulatedEquipment(cargoProfile);

	for (const equipment of simulatedEquipment) {
		// Check if prohibited conditions match
		if (rule.prohibited_conditions && evaluateCondition(rule.prohibited_conditions, equipment)) {
			// Check if compliant conditions can override
			if (!rule.compliant_conditions || !evaluateCondition(rule.compliant_conditions, equipment)) {
				const severity = rule.result_if_prohibited === 'critical' ? 'critical' as const : 'warning' as const;
				
				alerts.push({
					jurisdiction: reg.jurisdiction_name,
					postal_code: reg.postal_code,
					severity,
					category: rule.rule_name || 'Feature Restriction',
					message: `${reg.jurisdiction_name}: ${equipment.category} violates ${rule.rule_name}. ${rule.description || ''}`,
					citation: reg.statutory_citation || undefined,
					effective_date: reg.effective_date,
					effective_date_formatted: formatRegulationDate(reg.effective_date),
					last_verified: reg.last_verified,
					is_stale: isRegulationStale(reg.last_verified),
					details: {
						equipment_category: equipment.category,
						rule_violated: rule.rule_name,
						legal_definition: rule.legal_definition
					}
				});
			}
		}
	}

	return alerts;
}

/**
 * Create simulated equipment items based on cargo profile
 */
function createSimulatedEquipment(cargoProfile: CargoProfile): Array<{
	category: string;
	platform?: string;
	ammunition_capacity?: number;
	accepts_detachable_magazine?: boolean;
	features?: string[];
}> {
	const equipment: Array<{
		category: string;
		platform?: string;
		ammunition_capacity?: number;
		accepts_detachable_magazine?: boolean;
		features?: string[];
	}> = [];

	// Create rifle equipment if present
	if (cargoProfile.has_rifle) {
		equipment.push({
			category: 'rifle',
			platform: 'rifle',
			ammunition_capacity: cargoProfile.max_ammunition_capacity_by_platform?.rifle || cargoProfile.ammunition_capacity,
			accepts_detachable_magazine: true,
			// For testing, assume some common features that would trigger NY rules
			features: ['pistol_grip', 'flash_suppressor'] // These would trigger NY restrictions
		});
	}

	// Create handgun equipment if present
	if (cargoProfile.has_handgun) {
		equipment.push({
			category: 'handgun',
			platform: 'handgun',
			ammunition_capacity: cargoProfile.max_ammunition_capacity_by_platform?.handgun || cargoProfile.ammunition_capacity,
			accepts_detachable_magazine: true,
			features: [] // Standard handgun features
		});
	}

	// Create shotgun equipment if present
	if (cargoProfile.has_shotgun) {
		equipment.push({
			category: 'shotgun',
			platform: 'shotgun',
			ammunition_capacity: cargoProfile.max_ammunition_capacity_by_platform?.shotgun || cargoProfile.ammunition_capacity,
			accepts_detachable_magazine: false,
			features: [] // Standard shotgun features
		});
	}

	return equipment;
}

/**
 * Evaluate a rule condition against equipment
 */
function evaluateCondition(condition: any, equipment: any): boolean {
	if (!condition || typeof condition !== 'object') {
		return false;
	}

	// Handle AND conditions
	if (condition.AND && Array.isArray(condition.AND)) {
		return condition.AND.every((subCondition: any) => evaluateCondition(subCondition, equipment));
	}

	// Handle OR conditions
	if (condition.OR && Array.isArray(condition.OR)) {
		return condition.OR.some((subCondition: any) => evaluateCondition(subCondition, equipment));
	}

	// Handle direct property checks
	for (const [key, value] of Object.entries(condition)) {
		if (key === 'equipment_category') {
			if (equipment.category !== value) return false;
		} else if (key === 'accepts_detachable_magazine') {
			if (equipment.accepts_detachable_magazine !== value) return false;
		} else if (key === 'ammunition_capacity') {
			if (typeof value === 'object' && value !== null) {
				const capacityCheck = value as any;
				const equipmentCapacity = equipment.ammunition_capacity || 0;
				
				if (capacityCheck.gt !== undefined && equipmentCapacity <= capacityCheck.gt) return false;
				if (capacityCheck.gte !== undefined && equipmentCapacity < capacityCheck.gte) return false;
				if (capacityCheck.lt !== undefined && equipmentCapacity >= capacityCheck.lt) return false;
				if (capacityCheck.lte !== undefined && equipmentCapacity > capacityCheck.lte) return false;
			}
		} else if (key === 'features') {
			if (typeof value === 'object' && value !== null && equipment.features) {
				const featureCheck = value as any;
				
				if (featureCheck.contains) {
					if (!equipment.features.includes(featureCheck.contains)) return false;
				}
				
				if (featureCheck.excludes_all && Array.isArray(featureCheck.excludes_all)) {
					const hasAnyExcludedFeature = equipment.features.some((feature: string) => 
						featureCheck.excludes_all.includes(feature)
					);
					if (hasAnyExcludedFeature) return false;
				}
			}
		}
	}

	return true;
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

		// Check concealed carry requirements - ONLY applies to handguns
		if (reg.category === 'concealed_carry' && cargoProfile.has_handgun) {
			if (reg.is_restricted && reg.permit_required && !cargoProfile.has_concealed_carry_permit) {
				// Restrictive states requiring permits
				alerts.push({
					jurisdiction: reg.jurisdiction_name,
					postal_code: reg.postal_code,
					severity: reg.restriction_level >= 7 ? 'critical' : 'warning',
					category: 'Concealed Carry',
					message: `${reg.jurisdiction_name} requires a concealed carry permit for handguns. Your permit may not be recognized.`,
					citation: reg.statutory_citation || undefined,
					effective_date: reg.effective_date,
					effective_date_formatted: formatRegulationDate(reg.effective_date),
					last_verified: reg.last_verified,
					is_stale: isRegulationStale(reg.last_verified),
				});
			} else if (!reg.is_restricted && !reg.permit_required) {
				// Constitutional carry states - no permit required
				alerts.push({
					jurisdiction: reg.jurisdiction_name,
					postal_code: reg.postal_code,
					severity: 'info',
					category: 'Concealed Carry',
					message: `${reg.jurisdiction_name} allows constitutional carry for handguns. No permit required. ${reg.notes || ''}`,
					citation: reg.statutory_citation || undefined,
					effective_date: reg.effective_date,
					effective_date_formatted: formatRegulationDate(reg.effective_date),
					last_verified: reg.last_verified,
					is_stale: isRegulationStale(reg.last_verified),
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
					effective_date: reg.effective_date,
					effective_date_formatted: formatRegulationDate(reg.effective_date),
					last_verified: reg.last_verified,
					is_stale: isRegulationStale(reg.last_verified),
				});
			}
		}

		// Check rule-based compliance (NY-compliant rifles, etc.)
		if (reg.rule_definition && typeof reg.rule_definition === 'object') {
			const ruleAlerts = evaluateRuleBasedCompliance(reg, cargoProfile);
			alerts.push(...ruleAlerts);
		}

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
					effective_date: reg.effective_date,
					effective_date_formatted: formatRegulationDate(reg.effective_date),
					last_verified: reg.last_verified,
					is_stale: isRegulationStale(reg.last_verified),
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
				effective_date: reg.effective_date,
				effective_date_formatted: formatRegulationDate(reg.effective_date),
				last_verified: reg.last_verified,
				is_stale: isRegulationStale(reg.last_verified),
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
				effective_date: reg.effective_date,
				effective_date_formatted: formatRegulationDate(reg.effective_date),
				last_verified: reg.last_verified,
				is_stale: isRegulationStale(reg.last_verified),
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

	// Add informational alerts for jurisdictions with no triggered alerts
	const jurisdictionsWithAlerts = new Set(alerts.map(alert => alert.postal_code));
	const jurisdictionsWithoutAlerts = jurisdictions.filter(j => !jurisdictionsWithAlerts.has(j.postal_code));
	
	// Add info alerts for states with no triggered alerts
	jurisdictionsWithoutAlerts.forEach(jurisdiction => {
		const isOrigin = jurisdiction.route_position === 0.0;
		const isDestination = jurisdiction.route_position === 1.0;
		const hasRegulations = regulations.some(r => r.jurisdiction_id === jurisdiction.id);
		
		let message: string;
		if (isOrigin) {
			if (hasRegulations) {
				message = `Origin: ${jurisdiction.name}. Regulations on file but none apply to current loadout. Assuming loadout is legal at origin. Verify compliance with local and federal laws.`;
			} else {
				message = `Origin: ${jurisdiction.name}. No specific firearm restrictions found in our database. Assuming loadout is legal at origin. Verify compliance with local and federal laws.`;
			}
		} else if (isDestination) {
			if (hasRegulations) {
				message = `Destination: ${jurisdiction.name}. Regulations on file but none apply to current loadout. Follow federal and local laws upon arrival.`;
			} else {
				message = `Destination: ${jurisdiction.name}. No specific firearm restrictions found in our database. Follow federal and local laws upon arrival.`;
			}
		} else {
			if (hasRegulations) {
				message = `Route crosses ${jurisdiction.name}. Regulations on file but none apply to current loadout. Follow federal and local laws.`;
			} else {
				message = `Route crosses ${jurisdiction.name}. No specific firearm regulations found for this jurisdiction in our database. Follow federal and local laws.`;
			}
		}
		
		alerts.push({
			jurisdiction: jurisdiction.name,
			postal_code: jurisdiction.postal_code,
			severity: 'info' as const,
			category: isOrigin ? 'Origin' : isDestination ? 'Destination' : 'General',
			message,
			citation: null,
		});
	});

	// Group alerts by jurisdiction and sort by route order, then by severity
	const jurisdictionOrder = new Map(jurisdictions.map((j, index) => [j.postal_code, index]));
	const severityOrder = { critical: 0, warning: 1, info: 2 };
	
	alerts.sort((a, b) => {
		// First sort by jurisdiction order along route
		const aJurisdictionIndex = jurisdictionOrder.get(a.postal_code) ?? 999;
		const bJurisdictionIndex = jurisdictionOrder.get(b.postal_code) ?? 999;
		if (aJurisdictionIndex !== bJurisdictionIndex) {
			return aJurisdictionIndex - bJurisdictionIndex;
		}
		// Then sort by severity within each jurisdiction
		return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
	});
    
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

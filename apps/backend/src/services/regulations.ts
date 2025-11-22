/**
 * Regulation Analysis Service
 * Analyzes routes against jurisdiction regulations to generate compliance alerts
 */

import type { PoolClient } from 'pg';

export interface CargoProfile {
	has_firearms: boolean;
	firearm_types?: ('handgun' | 'rifle' | 'shotgun')[];
	has_concealed_carry_permit?: boolean;
	permit_states?: string[]; // States where permit is valid
	magazine_capacity?: number;
	has_assault_weapon?: boolean;
}

export interface JurisdictionRegulation {
	jurisdiction_id: string;
	jurisdiction_name: string;
	postal_code: string;
	category: string;
	is_restricted: boolean;
	restriction_level: number;
	permit_required: boolean;
	permit_type: string | null;
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
		   r.permit_type,
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

	if (!cargoProfile.has_firearms) {
		return alerts; // No firearms, no alerts needed
	}

	for (const reg of regulations) {
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
			} else if (
				reg.permit_type === 'may_issue' ||
				reg.permit_type === 'no_issue'
			) {
				alerts.push({
					jurisdiction: reg.jurisdiction_name,
					postal_code: reg.postal_code,
					severity: 'critical',
					category: 'Concealed Carry',
					message: `${reg.jurisdiction_name} is a ${reg.permit_type === 'no_issue' ? 'no-issue' : 'may-issue'} state. Concealed carry may not be permitted.`,
					citation: reg.statutory_citation || undefined,
				});
			}
		}

		// Check magazine capacity limits
		if (
			reg.category === 'magazine_capacity' &&
			reg.magazine_capacity_limit &&
			cargoProfile.magazine_capacity
		) {
			if (cargoProfile.magazine_capacity > reg.magazine_capacity_limit) {
				alerts.push({
					jurisdiction: reg.jurisdiction_name,
					postal_code: reg.postal_code,
					severity: 'critical',
					category: 'Magazine Capacity',
					message: `${reg.jurisdiction_name} limits magazine capacity to ${reg.magazine_capacity_limit} rounds. Your ${cargoProfile.magazine_capacity}-round magazines are prohibited.`,
					citation: reg.statutory_citation || undefined,
				});
			}
		}

		// Check assault weapons ban
		if (
			reg.category === 'assault_weapons' &&
			reg.is_restricted &&
			cargoProfile.has_assault_weapon
		) {
			alerts.push({
				jurisdiction: reg.jurisdiction_name,
				postal_code: reg.postal_code,
				severity: 'critical',
				category: 'Assault Weapons',
				message: `${reg.jurisdiction_name} prohibits assault weapons. Your firearm may be classified as prohibited.`,
				citation: reg.statutory_citation || undefined,
			});
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

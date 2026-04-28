/**
 * Local Ordinances Service
 * 
 * Handles city and county-level firearm regulations for major metropolitan areas
 */

import type { PoolClient } from 'pg';

export interface LocalOrdinance {
  id: string;
  jurisdiction_id: string;
  jurisdiction_name: string;
  jurisdiction_type: string;
  postal_code: string;
  parent_state: string;
  ordinance_type: string;
  is_more_restrictive: boolean;
  prohibition_scope?: string;
  affected_areas?: Record<string, any>;
  permit_requirements?: Record<string, any>;
  penalties?: Record<string, any>;
  exemptions?: Record<string, any>;
  enforcement_notes?: string;
  ordinance_number?: string;
  state_preemption_status?: 'preempted' | 'allowed' | 'grandfathered' | 'unclear';
  effective_date?: string;
  last_verified: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalComplianceAlert {
  jurisdiction: string;
  jurisdiction_type: string;
  postal_code: string;
  state: string;
  ordinance_type: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  message: string;
  requirements?: Record<string, any>;
  penalties?: Record<string, any>;
  ordinance_citation?: string;
  preemption_status?: string;
  recommendations: string[];
  effective_date?: string;
  last_verified?: string;
}

export interface LocalOrdinanceAnalysis {
  jurisdictions_with_ordinances: string[];
  total_ordinances: number;
  alerts: LocalComplianceAlert[];
  summary: {
    cities_with_restrictions: number;
    counties_with_restrictions: number;
    preempted_ordinances: number;
    active_ordinances: number;
    critical_alerts: number;
    warning_alerts: number;
    info_alerts: number;
  };
  recommendations: string[];
  preemption_summary: {
    preempted: number;
    allowed: number;
    unclear: number;
    grandfathered: number;
  };
}

/**
 * Get all local ordinances for specific jurisdictions (cities/counties)
 */
export async function getLocalOrdinancesForJurisdictions(
  client: PoolClient,
  jurisdictionIds: string[]
): Promise<LocalOrdinance[]> {
  if (jurisdictionIds.length === 0) return [];

  const result = await client.query(
    `SELECT 
       lo.*,
       j.name as jurisdiction_name,
       j.type as jurisdiction_type,
       j.postal_code,
       parent.postal_code as parent_state
     FROM local_ordinances lo
     JOIN jurisdictions j ON lo.jurisdiction_id = j.id
     LEFT JOIN jurisdictions parent ON j.parent_id = parent.id
     WHERE lo.jurisdiction_id = ANY($1)
     ORDER BY j.name, lo.ordinance_type`,
    [jurisdictionIds]
  );

  return result.rows;
}

/**
 * Get local ordinances by state - finds all cities/counties in a state with ordinances
 */
export async function getLocalOrdinancesByState(
  client: PoolClient,
  statePostalCode: string
): Promise<LocalOrdinance[]> {
  const result = await client.query(
    `SELECT 
       lo.*,
       j.name as jurisdiction_name,
       j.type as jurisdiction_type,
       j.postal_code,
       parent.postal_code as parent_state
     FROM local_ordinances lo
     JOIN jurisdictions j ON lo.jurisdiction_id = j.id
     JOIN jurisdictions parent ON j.parent_id = parent.id
     WHERE parent.postal_code = $1 AND parent.type = 'state'
     ORDER BY j.name, lo.ordinance_type`,
    [statePostalCode.toUpperCase()]
  );

  return result.rows;
}

/**
 * Find local jurisdictions (cities/counties) that intersect with a route
 */
export async function findLocalJurisdictionsOnRoute(
  client: PoolClient,
  routeGeometry: GeoJSON.LineString
): Promise<Array<{ id: string; name: string; type: string; postal_code: string; parent_state: string; route_position: number }>> {
  // For now, we'll use a simplified approach since most local jurisdictions don't have geometry data yet
  // In a full implementation, this would use PostGIS spatial queries
  
  // Get states on the route first
  const stateResult = await client.query(
    `WITH route_line AS (
       SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom
     )
     SELECT DISTINCT j.id, j.postal_code
     FROM jurisdictions j, route_line rl
     WHERE j.type = 'state'
       AND j.geometry IS NOT NULL
       AND ST_Intersects(j.geometry, rl.geom)`,
    [JSON.stringify(routeGeometry)]
  );

  if (stateResult.rows.length === 0) {
    return [];
  }

  const statePostalCodes = stateResult.rows.map(row => row.postal_code);

  // Get major cities in those states
  const result = await client.query(
    `SELECT 
       j.id, j.name, j.type, j.postal_code,
       parent.postal_code as parent_state,
       0.5 as route_position
     FROM jurisdictions j
     JOIN jurisdictions parent ON j.parent_id = parent.id
     WHERE j.type IN ('city', 'county')
       AND parent.postal_code = ANY($1)
       AND EXISTS (
         SELECT 1 FROM local_ordinances lo WHERE lo.jurisdiction_id = j.id
       )
     ORDER BY j.name`,
    [statePostalCodes]
  );

  return result.rows;
}

/**
 * Analyze local ordinance compliance for a route
 */
export async function analyzeLocalOrdinanceRoute(
  client: PoolClient,
  routeGeometry: GeoJSON.LineString,
  cargoProfile?: any
): Promise<LocalOrdinanceAnalysis> {
  // Find local jurisdictions on the route
  const jurisdictions = await findLocalJurisdictionsOnRoute(client, routeGeometry);
  
  if (jurisdictions.length === 0) {
    return {
      jurisdictions_with_ordinances: [],
      total_ordinances: 0,
      alerts: [],
      summary: {
        cities_with_restrictions: 0,
        counties_with_restrictions: 0,
        preempted_ordinances: 0,
        active_ordinances: 0,
        critical_alerts: 0,
        warning_alerts: 0,
        info_alerts: 0
      },
      recommendations: ['No local ordinances found that affect your route.'],
      preemption_summary: {
        preempted: 0,
        allowed: 0,
        unclear: 0,
        grandfathered: 0
      }
    };
  }

  // Get ordinances for these jurisdictions
  const jurisdictionIds = jurisdictions.map(j => j.id);
  const ordinances = await getLocalOrdinancesForJurisdictions(client, jurisdictionIds);

  // Generate alerts
  const alerts: LocalComplianceAlert[] = [];
  const preemptionCounts = { preempted: 0, allowed: 0, unclear: 0, grandfathered: 0 };

  for (const ordinance of ordinances) {
    // Count preemption status
    if (ordinance.state_preemption_status) {
      preemptionCounts[ordinance.state_preemption_status]++;
    }

    // Determine severity based on preemption status and restriction type
    let severity: 'info' | 'warning' | 'critical' = 'info';
    let category = 'Local Regulation';
    let recommendations: string[] = [];

    if (ordinance.state_preemption_status === 'preempted') {
      severity = 'info';
      category = 'Preempted Ordinance';
      recommendations = [
        'Ordinance likely preempted by state law',
        'Follow state regulations instead',
        'Verify current legal status'
      ];
    } else if (ordinance.state_preemption_status === 'unclear') {
      severity = 'warning';
      category = 'Uncertain Status';
      recommendations = [
        'Legal status unclear due to ongoing challenges',
        'Consult local legal counsel',
        'Exercise caution in this jurisdiction'
      ];
    } else {
      // Active ordinance
      if (ordinance.ordinance_type === 'assault_weapons' || 
          ordinance.ordinance_type === 'magazine_capacity' ||
          ordinance.ordinance_type === 'concealed_carry') {
        severity = 'warning';
        category = 'Active Restriction';
      } else {
        severity = 'info';
        category = 'Local Requirement';
      }

      recommendations = [
        'Follow local ordinance requirements',
        'Carry required documentation',
        'Be aware of local enforcement practices'
      ];

      if (ordinance.penalties) {
        recommendations.push('Review penalty structure for violations');
      }
    }

    // Build message
    let message = `${ordinance.jurisdiction_name} (${ordinance.jurisdiction_type}): `;
    
    if (ordinance.prohibition_scope) {
      message += `${ordinance.prohibition_scope} - `;
    }
    
    message += `${ordinance.ordinance_type.replace(/_/g, ' ')} regulations apply.`;
    
    if (ordinance.state_preemption_status === 'preempted') {
      message += ' (Likely preempted by state law)';
    }

    alerts.push({
      jurisdiction: ordinance.jurisdiction_name,
      jurisdiction_type: ordinance.jurisdiction_type,
      postal_code: ordinance.postal_code,
      state: ordinance.parent_state,
      ordinance_type: ordinance.ordinance_type,
      severity,
      category,
      message,
      requirements: ordinance.permit_requirements,
      penalties: ordinance.penalties,
      ordinance_citation: ordinance.ordinance_number,
      preemption_status: ordinance.state_preemption_status,
      recommendations,
      effective_date: ordinance.effective_date,
      last_verified: ordinance.last_verified
    });
  }

  // Generate overall recommendations
  const recommendations: string[] = [];
  
  const activeOrdinances = ordinances.filter(o => o.state_preemption_status !== 'preempted').length;
  const preemptedOrdinances = ordinances.filter(o => o.state_preemption_status === 'preempted').length;
  
  if (activeOrdinances > 0) {
    recommendations.push(`${activeOrdinances} active local ordinances may affect your route.`);
    recommendations.push('Review city and county regulations carefully.');
  }
  
  if (preemptedOrdinances > 0) {
    recommendations.push(`${preemptedOrdinances} ordinances likely preempted by state law.`);
  }
  
  recommendations.push('Local laws can change frequently - verify current status before travel.');
  recommendations.push('When in doubt, follow the most restrictive applicable law.');

  // Count jurisdiction types
  const cities = new Set(ordinances.filter(o => o.jurisdiction_type === 'city').map(o => o.jurisdiction_id));
  const counties = new Set(ordinances.filter(o => o.jurisdiction_type === 'county').map(o => o.jurisdiction_id));

  // Sort alerts by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    jurisdictions_with_ordinances: jurisdictions.map(j => `${j.name} (${j.type}), ${j.parent_state}`),
    total_ordinances: ordinances.length,
    alerts,
    summary: {
      cities_with_restrictions: cities.size,
      counties_with_restrictions: counties.size,
      preempted_ordinances: preemptedOrdinances,
      active_ordinances: activeOrdinances,
      critical_alerts: alerts.filter(a => a.severity === 'critical').length,
      warning_alerts: alerts.filter(a => a.severity === 'warning').length,
      info_alerts: alerts.filter(a => a.severity === 'info').length
    },
    recommendations,
    preemption_summary: preemptionCounts
  };
}

/**
 * Get local ordinances for a specific city or county
 */
export async function getLocalOrdinancesForJurisdiction(
  client: PoolClient,
  jurisdictionName: string,
  jurisdictionType: 'city' | 'county' = 'city'
): Promise<LocalOrdinance[]> {
  const result = await client.query(
    `SELECT 
       lo.*,
       j.name as jurisdiction_name,
       j.type as jurisdiction_type,
       j.postal_code,
       parent.postal_code as parent_state
     FROM local_ordinances lo
     JOIN jurisdictions j ON lo.jurisdiction_id = j.id
     LEFT JOIN jurisdictions parent ON j.parent_id = parent.id
     WHERE LOWER(j.name) = LOWER($1) AND j.type = $2
     ORDER BY lo.ordinance_type`,
    [jurisdictionName, jurisdictionType]
  );

  return result.rows;
}

/**
 * Search local ordinances by type
 */
export async function searchLocalOrdinancesByType(
  client: PoolClient,
  ordinanceType: string
): Promise<LocalOrdinance[]> {
  const result = await client.query(
    `SELECT 
       lo.*,
       j.name as jurisdiction_name,
       j.type as jurisdiction_type,
       j.postal_code,
       parent.postal_code as parent_state
     FROM local_ordinances lo
     JOIN jurisdictions j ON lo.jurisdiction_id = j.id
     LEFT JOIN jurisdictions parent ON j.parent_id = parent.id
     WHERE lo.ordinance_type = $1
     ORDER BY parent.postal_code, j.name`,
    [ordinanceType]
  );

  return result.rows;
}

/**
 * Get summary of all local ordinances in the system
 */
export async function getLocalOrdinancesSummary(client: PoolClient): Promise<{
  total_ordinances: number;
  jurisdictions_with_ordinances: number;
  ordinances_by_type: Array<{ ordinance_type: string; count: number }>;
  ordinances_by_state: Array<{ state: string; count: number }>;
  preemption_summary: Array<{ status: string; count: number }>;
}> {
  // Get basic counts
  const totalResult = await client.query(`
    SELECT COUNT(*) as total FROM local_ordinances
  `);

  const jurisdictionsResult = await client.query(`
    SELECT COUNT(DISTINCT jurisdiction_id) as count FROM local_ordinances
  `);

  // Get ordinances by type
  const typeResult = await client.query(`
    SELECT ordinance_type, COUNT(*) as count
    FROM local_ordinances
    GROUP BY ordinance_type
    ORDER BY count DESC, ordinance_type
  `);

  // Get ordinances by state
  const stateResult = await client.query(`
    SELECT 
      parent.postal_code as state,
      COUNT(*) as count
    FROM local_ordinances lo
    JOIN jurisdictions j ON lo.jurisdiction_id = j.id
    JOIN jurisdictions parent ON j.parent_id = parent.id
    WHERE parent.type = 'state'
    GROUP BY parent.postal_code
    ORDER BY count DESC, parent.postal_code
  `);

  // Get preemption summary
  const preemptionResult = await client.query(`
    SELECT 
      COALESCE(state_preemption_status, 'unknown') as status,
      COUNT(*) as count
    FROM local_ordinances
    GROUP BY state_preemption_status
    ORDER BY count DESC
  `);

  return {
    total_ordinances: parseInt(totalResult.rows[0].total),
    jurisdictions_with_ordinances: parseInt(jurisdictionsResult.rows[0].count),
    ordinances_by_type: typeResult.rows,
    ordinances_by_state: stateResult.rows,
    preemption_summary: preemptionResult.rows
  };
}

/**
 * Add or update a local ordinance
 */
export async function updateLocalOrdinance(
  client: PoolClient,
  jurisdictionId: string,
  ordinanceType: string,
  ordinanceData: Partial<LocalOrdinance>
): Promise<void> {
  await client.query(
    `INSERT INTO local_ordinances (
       jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
       affected_areas, permit_requirements, penalties, exemptions, enforcement_notes,
       ordinance_number, state_preemption_status, effective_date, notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (jurisdiction_id, ordinance_type) 
     DO UPDATE SET
       is_more_restrictive = EXCLUDED.is_more_restrictive,
       prohibition_scope = EXCLUDED.prohibition_scope,
       affected_areas = EXCLUDED.affected_areas,
       permit_requirements = EXCLUDED.permit_requirements,
       penalties = EXCLUDED.penalties,
       exemptions = EXCLUDED.exemptions,
       enforcement_notes = EXCLUDED.enforcement_notes,
       ordinance_number = EXCLUDED.ordinance_number,
       state_preemption_status = EXCLUDED.state_preemption_status,
       effective_date = EXCLUDED.effective_date,
       notes = EXCLUDED.notes,
       last_verified = CURRENT_DATE,
       updated_at = CURRENT_TIMESTAMP`,
    [
      jurisdictionId,
      ordinanceType,
      ordinanceData.is_more_restrictive ?? true,
      ordinanceData.prohibition_scope,
      ordinanceData.affected_areas ? JSON.stringify(ordinanceData.affected_areas) : null,
      ordinanceData.permit_requirements ? JSON.stringify(ordinanceData.permit_requirements) : null,
      ordinanceData.penalties ? JSON.stringify(ordinanceData.penalties) : null,
      ordinanceData.exemptions ? JSON.stringify(ordinanceData.exemptions) : null,
      ordinanceData.enforcement_notes,
      ordinanceData.ordinance_number,
      ordinanceData.state_preemption_status,
      ordinanceData.effective_date,
      ordinanceData.notes
    ]
  );
}
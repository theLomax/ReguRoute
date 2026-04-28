/**
 * NFA Item Service
 * 
 * Handles NFA item tracking and compliance checking for travel routes
 */

import type { PoolClient } from 'pg';

export interface NfaItem {
  id: string;
  user_id: string;
  item_type: 'suppressor' | 'sbr' | 'sbs' | 'machine_gun' | 'aow' | 'destructive_device' | 'other';
  manufacturer?: string;
  model?: string;
  caliber?: string;
  serial_number?: string;
  barrel_length?: number;
  overall_length?: number;
  tax_stamp_number?: string;
  registration_date?: string;
  transfer_date?: string;
  form_type?: string;
  trust_name?: string;
  storage_location?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NfaRegulation {
  id: string;
  jurisdiction_id: string;
  jurisdiction_name: string;
  postal_code: string;
  nfa_item_type: string;
  is_prohibited: boolean;
  possession_restricted: boolean;
  transport_restricted: boolean;
  hunting_allowed?: boolean;
  state_registration_required: boolean;
  notification_required: boolean;
  special_requirements?: Record<string, any>;
  exemptions?: Record<string, any>;
  penalties?: Record<string, any>;
  statutory_citation?: string;
  effective_date?: string;
  last_verified: string;
  notes?: string;
}

export interface NfaComplianceAlert {
  jurisdiction: string;
  postal_code: string;
  item_type: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  message: string;
  requirements?: Record<string, any>;
  citation?: string;
  recommendations: string[];
  effective_date?: string;
  last_verified?: string;
}

export interface NfaRouteAnalysis {
  nfa_items: NfaItem[];
  jurisdictions_crossed: string[];
  alerts: NfaComplianceAlert[];
  summary: {
    total_jurisdictions: number;
    prohibited_jurisdictions: number;
    restricted_jurisdictions: number;
    compliant_jurisdictions: number;
    critical_alerts: number;
    warning_alerts: number;
    info_alerts: number;
  };
  recommendations: string[];
}

/**
 * Get all NFA items for a user
 */
export async function getUserNfaItems(
  client: PoolClient,
  userId: string
): Promise<NfaItem[]> {
  const result = await client.query(
    `SELECT * FROM nfa_items 
     WHERE user_id = $1 AND active = true 
     ORDER BY item_type, manufacturer, model`,
    [userId]
  );

  return result.rows;
}

/**
 * Add a new NFA item for a user
 */
export async function addNfaItem(
  client: PoolClient,
  nfaItem: Omit<NfaItem, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const result = await client.query(
    `INSERT INTO nfa_items (
       user_id, item_type, manufacturer, model, caliber, serial_number,
       barrel_length, overall_length, tax_stamp_number, registration_date,
       transfer_date, form_type, trust_name, storage_location, notes, active
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING id`,
    [
      nfaItem.user_id, nfaItem.item_type, nfaItem.manufacturer, nfaItem.model,
      nfaItem.caliber, nfaItem.serial_number, nfaItem.barrel_length,
      nfaItem.overall_length, nfaItem.tax_stamp_number, nfaItem.registration_date,
      nfaItem.transfer_date, nfaItem.form_type, nfaItem.trust_name,
      nfaItem.storage_location, nfaItem.notes, nfaItem.active
    ]
  );

  return result.rows[0].id;
}

/**
 * Update an existing NFA item
 */
export async function updateNfaItem(
  client: PoolClient,
  itemId: string,
  userId: string,
  updates: Partial<NfaItem>
): Promise<boolean> {
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'id' && key !== 'created_at' && value !== undefined) {
      setClause.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClause.length === 0) return false;

  setClause.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(itemId, userId);

  const result = await client.query(
    `UPDATE nfa_items SET ${setClause.join(', ')} 
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    values
  );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Delete an NFA item (mark as inactive)
 */
export async function deleteNfaItem(
  client: PoolClient,
  itemId: string,
  userId: string
): Promise<boolean> {
  const result = await client.query(
    `UPDATE nfa_items SET active = false, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2`,
    [itemId, userId]
  );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Get NFA regulations for specific jurisdictions
 */
export async function getNfaRegulationsForJurisdictions(
  client: PoolClient,
  jurisdictionIds: string[]
): Promise<NfaRegulation[]> {
  if (jurisdictionIds.length === 0) return [];

  const result = await client.query(
    `SELECT 
       nr.*,
       j.name as jurisdiction_name,
       j.postal_code
     FROM nfa_regulations nr
     JOIN jurisdictions j ON nr.jurisdiction_id = j.id
     WHERE nr.jurisdiction_id = ANY($1)
     ORDER BY j.name, nr.nfa_item_type`,
    [jurisdictionIds]
  );

  return result.rows;
}

/**
 * Get NFA regulations for specific item types in jurisdictions
 */
export async function getNfaRegulationsForItemTypes(
  client: PoolClient,
  jurisdictionIds: string[],
  itemTypes: string[]
): Promise<NfaRegulation[]> {
  if (jurisdictionIds.length === 0 || itemTypes.length === 0) return [];

  const result = await client.query(
    `SELECT 
       nr.*,
       j.name as jurisdiction_name,
       j.postal_code
     FROM nfa_regulations nr
     JOIN jurisdictions j ON nr.jurisdiction_id = j.id
     WHERE nr.jurisdiction_id = ANY($1)
       AND (nr.nfa_item_type = ANY($2) OR nr.nfa_item_type = 'all')
     ORDER BY j.name, nr.nfa_item_type`,
    [jurisdictionIds, itemTypes]
  );

  return result.rows;
}

/**
 * Analyze NFA compliance for a route
 */
export async function analyzeNfaRoute(
  client: PoolClient,
  userId: string,
  jurisdictionIds: string[]
): Promise<NfaRouteAnalysis> {
  // Get user's NFA items
  const nfaItems = await getUserNfaItems(client, userId);
  
  if (nfaItems.length === 0) {
    // No NFA items, no compliance issues
    const jurisdictionResult = await client.query(
      `SELECT name, postal_code FROM jurisdictions WHERE id = ANY($1) ORDER BY name`,
      [jurisdictionIds]
    );

    return {
      nfa_items: [],
      jurisdictions_crossed: jurisdictionResult.rows.map(j => `${j.name} (${j.postal_code})`),
      alerts: [],
      summary: {
        total_jurisdictions: jurisdictionIds.length,
        prohibited_jurisdictions: 0,
        restricted_jurisdictions: 0,
        compliant_jurisdictions: jurisdictionIds.length,
        critical_alerts: 0,
        warning_alerts: 0,
        info_alerts: 0
      },
      recommendations: ['No NFA items detected. Standard firearm regulations apply.']
    };
  }

  // Get item types user owns
  const itemTypes = [...new Set(nfaItems.map(item => item.item_type))];
  
  // Get relevant regulations
  const regulations = await getNfaRegulationsForItemTypes(client, jurisdictionIds, itemTypes);
  
  // Get jurisdiction details
  const jurisdictionResult = await client.query(
    `SELECT id, name, postal_code FROM jurisdictions WHERE id = ANY($1) ORDER BY name`,
    [jurisdictionIds]
  );
  const jurisdictions = jurisdictionResult.rows;

  // Generate alerts
  const alerts: NfaComplianceAlert[] = [];
  const prohibitedJurisdictions = new Set<string>();
  const restrictedJurisdictions = new Set<string>();

  for (const jurisdiction of jurisdictions) {
    for (const itemType of itemTypes) {
      const userItems = nfaItems.filter(item => item.item_type === itemType);
      if (userItems.length === 0) continue;

      // Find regulations for this item type in this jurisdiction
      const applicable = regulations.filter(reg => 
        reg.jurisdiction_id === jurisdiction.id && 
        (reg.nfa_item_type === itemType || reg.nfa_item_type === 'all')
      );

      if (applicable.length === 0) {
        // No specific state regulation - assume federal law applies
        alerts.push({
          jurisdiction: jurisdiction.name,
          postal_code: jurisdiction.postal_code,
          item_type: itemType,
          severity: 'info',
          category: 'Federal Compliance',
          message: `${jurisdiction.name}: ${itemType.toUpperCase()} regulated under federal NFA. State has no additional restrictions.`,
          recommendations: ['Ensure valid ATF tax stamp', 'Carry tax stamp documentation', 'Follow federal transport laws']
        });
        continue;
      }

      const reg = applicable[0]; // Use first matching regulation

      if (reg.is_prohibited) {
        prohibitedJurisdictions.add(jurisdiction.postal_code);
        alerts.push({
          jurisdiction: jurisdiction.name,
          postal_code: jurisdiction.postal_code,
          item_type: itemType,
          severity: 'critical',
          category: 'Prohibited Item',
          message: `${jurisdiction.name}: ${itemType.toUpperCase()} possession is PROHIBITED. Do not travel through this state with this item.`,
          citation: reg.statutory_citation,
          requirements: reg.special_requirements,
          recommendations: [
            'AVOID this jurisdiction entirely',
            'Consider alternate route',
            'Use locked transport through jurisdiction (if legal)',
            'Consult legal counsel'
          ],
          effective_date: reg.effective_date,
          last_verified: reg.last_verified
        });
      } else if (reg.possession_restricted || reg.transport_restricted || reg.state_registration_required) {
        restrictedJurisdictions.add(jurisdiction.postal_code);
        const severity = reg.transport_restricted ? 'warning' : 'info';
        
        const restrictions = [];
        if (reg.possession_restricted) restrictions.push('possession restricted');
        if (reg.transport_restricted) restrictions.push('transport restricted');
        if (reg.state_registration_required) restrictions.push('state registration required');
        if (reg.notification_required) restrictions.push('law enforcement notification required');

        const recommendations = ['Verify current compliance requirements'];
        if (reg.state_registration_required) recommendations.push('Obtain required state registration');
        if (reg.notification_required) recommendations.push('Notify local law enforcement');
        if (reg.special_requirements) recommendations.push('Review special requirements');
        recommendations.push('Carry all required documentation');

        alerts.push({
          jurisdiction: jurisdiction.name,
          postal_code: jurisdiction.postal_code,
          item_type: itemType,
          severity,
          category: 'Restricted Item',
          message: `${jurisdiction.name}: ${itemType.toUpperCase()} has restrictions - ${restrictions.join(', ')}.`,
          citation: reg.statutory_citation,
          requirements: reg.special_requirements,
          recommendations,
          effective_date: reg.effective_date,
          last_verified: reg.last_verified
        });
      } else {
        // Allowed with federal compliance
        const huntingNote = reg.hunting_allowed === true ? ' Hunting use permitted.' : 
                           reg.hunting_allowed === false ? ' Hunting use prohibited.' : '';
        
        alerts.push({
          jurisdiction: jurisdiction.name,
          postal_code: jurisdiction.postal_code,
          item_type: itemType,
          severity: 'info',
          category: 'Compliant',
          message: `${jurisdiction.name}: ${itemType.toUpperCase()} allowed with federal compliance.${huntingNote}`,
          citation: reg.statutory_citation,
          recommendations: ['Maintain ATF compliance', 'Carry tax stamp documentation'],
          effective_date: reg.effective_date,
          last_verified: reg.last_verified
        });
      }
    }
  }

  // Generate overall recommendations
  const recommendations: string[] = [];
  
  if (prohibitedJurisdictions.size > 0) {
    recommendations.push(
      `CRITICAL: ${prohibitedJurisdictions.size} jurisdictions prohibit your NFA items. Avoid these areas or use alternate routes.`
    );
  }
  
  if (restrictedJurisdictions.size > 0) {
    recommendations.push(
      `${restrictedJurisdictions.size} jurisdictions have restrictions on your NFA items. Review compliance requirements.`
    );
  }
  
  if (prohibitedJurisdictions.size === 0 && restrictedJurisdictions.size === 0) {
    recommendations.push(
      'Good news! No major restrictions found for your NFA items on this route. Ensure federal compliance.'
    );
  }
  
  recommendations.push('Always verify current laws before travel');
  recommendations.push('Consult legal counsel for complex situations');

  // Sort alerts by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    nfa_items: nfaItems,
    jurisdictions_crossed: jurisdictions.map(j => `${j.name} (${j.postal_code})`),
    alerts,
    summary: {
      total_jurisdictions: jurisdictions.length,
      prohibited_jurisdictions: prohibitedJurisdictions.size,
      restricted_jurisdictions: restrictedJurisdictions.size,
      compliant_jurisdictions: jurisdictions.length - prohibitedJurisdictions.size - restrictedJurisdictions.size,
      critical_alerts: alerts.filter(a => a.severity === 'critical').length,
      warning_alerts: alerts.filter(a => a.severity === 'warning').length,
      info_alerts: alerts.filter(a => a.severity === 'info').length
    },
    recommendations
  };
}

/**
 * Get all available NFA regulations for a specific state
 */
export async function getNfaRegulationsForState(
  client: PoolClient,
  statePostalCode: string
): Promise<NfaRegulation[]> {
  const result = await client.query(
    `SELECT 
       nr.*,
       j.name as jurisdiction_name,
       j.postal_code
     FROM nfa_regulations nr
     JOIN jurisdictions j ON nr.jurisdiction_id = j.id
     WHERE j.postal_code = $1 AND j.type = 'state'
     ORDER BY nr.nfa_item_type`,
    [statePostalCode.toUpperCase()]
  );

  return result.rows;
}

/**
 * Add or update NFA regulation for a jurisdiction
 */
export async function updateNfaRegulation(
  client: PoolClient,
  jurisdictionId: string,
  itemType: string,
  regulation: Partial<NfaRegulation>
): Promise<void> {
  await client.query(
    `INSERT INTO nfa_regulations (
       jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
       transport_restricted, hunting_allowed, state_registration_required,
       notification_required, special_requirements, exemptions, penalties,
       statutory_citation, effective_date, notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (jurisdiction_id, nfa_item_type) DO UPDATE SET
       is_prohibited = EXCLUDED.is_prohibited,
       possession_restricted = EXCLUDED.possession_restricted,
       transport_restricted = EXCLUDED.transport_restricted,
       hunting_allowed = EXCLUDED.hunting_allowed,
       state_registration_required = EXCLUDED.state_registration_required,
       notification_required = EXCLUDED.notification_required,
       special_requirements = EXCLUDED.special_requirements,
       exemptions = EXCLUDED.exemptions,
       penalties = EXCLUDED.penalties,
       statutory_citation = EXCLUDED.statutory_citation,
       effective_date = EXCLUDED.effective_date,
       notes = EXCLUDED.notes,
       last_verified = CURRENT_DATE,
       updated_at = CURRENT_TIMESTAMP`,
    [
      jurisdictionId, itemType,
      regulation.is_prohibited || false,
      regulation.possession_restricted || false,
      regulation.transport_restricted || false,
      regulation.hunting_allowed,
      regulation.state_registration_required || false,
      regulation.notification_required || false,
      regulation.special_requirements ? JSON.stringify(regulation.special_requirements) : null,
      regulation.exemptions ? JSON.stringify(regulation.exemptions) : null,
      regulation.penalties ? JSON.stringify(regulation.penalties) : null,
      regulation.statutory_citation,
      regulation.effective_date,
      regulation.notes
    ]
  );
}
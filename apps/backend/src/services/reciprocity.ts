/**
 * Interstate Reciprocity Service
 * 
 * Handles concealed carry permit reciprocity calculations and lookups
 * for travel compliance analysis
 */

import type { PoolClient } from 'pg';

export interface PermitType {
  id: string;
  state_id: string;
  permit_name: string;
  permit_class: 'standard' | 'enhanced' | 'provisional' | 'non_resident' | 'lifetime' | 'military';
  requirements: Record<string, any>;
  reciprocity_value: number;
  active: boolean;
}

export interface ReciprocityRecord {
  id: string;
  issuing_state_id: string;
  issuing_state_name: string;
  issuing_postal_code: string;
  recognizing_state_id: string;
  recognizing_state_name: string;
  recognizing_postal_code: string;
  recognition_type: 'full' | 'partial' | 'resident_only' | 'none';
  permit_types: Record<string, any>;
  restrictions: Record<string, any> | null;
  notes: string | null;
  effective_date: string | null;
  last_verified: string;
}

export interface ReciprocityAnalysis {
  permit_holder_state: string;
  travel_states: string[];
  recognition_summary: {
    recognized: string[];
    not_recognized: string[];
    partial_recognition: string[];
    resident_only: string[];
  };
  recommendations: string[];
  detailed_analysis: Array<{
    state: string;
    recognition_type: string;
    notes: string | null;
    recommendation: string;
  }>;
}

/**
 * Get all permit types for a specific state
 */
export async function getPermitTypesForState(
  client: PoolClient,
  statePostalCode: string
): Promise<PermitType[]> {
  const result = await client.query(`
    SELECT 
      pt.*,
      j.postal_code,
      j.name as state_name
    FROM permit_types pt
    JOIN jurisdictions j ON pt.state_id = j.id
    WHERE j.postal_code = $1 
      AND j.type = 'state'
      AND pt.active = true
    ORDER BY pt.reciprocity_value DESC, pt.permit_name
  `, [statePostalCode]);

  return result.rows;
}

/**
 * Check reciprocity between two specific states
 */
export async function checkReciprocity(
  client: PoolClient,
  issuingState: string,
  recognizingState: string
): Promise<ReciprocityRecord | null> {
  const result = await client.query(`
    SELECT 
      ir.*,
      issuing.name as issuing_state_name,
      issuing.postal_code as issuing_postal_code,
      recognizing.name as recognizing_state_name,
      recognizing.postal_code as recognizing_postal_code
    FROM interstate_reciprocity ir
    JOIN jurisdictions issuing ON ir.issuing_state_id = issuing.id
    JOIN jurisdictions recognizing ON ir.recognizing_state_id = recognizing.id
    WHERE issuing.postal_code = $1 
      AND recognizing.postal_code = $2
      AND issuing.type = 'state'
      AND recognizing.type = 'state'
  `, [issuingState, recognizingState]);

  return result.rows[0] || null;
}

/**
 * Get comprehensive reciprocity analysis for a permit holder's travel route
 */
export async function analyzeRouteReciprocity(
  client: PoolClient,
  permitHolderState: string,
  travelStates: string[],
  permitClass: string = 'standard'
): Promise<ReciprocityAnalysis> {
  const analysis: ReciprocityAnalysis = {
    permit_holder_state: permitHolderState,
    travel_states: travelStates,
    recognition_summary: {
      recognized: [],
      not_recognized: [],
      partial_recognition: [],
      resident_only: []
    },
    recommendations: [],
    detailed_analysis: []
  };

  for (const travelState of travelStates) {
    if (travelState === permitHolderState) {
      // Always recognized in issuing state
      analysis.recognition_summary.recognized.push(travelState);
      analysis.detailed_analysis.push({
        state: travelState,
        recognition_type: 'full',
        notes: 'Issuing state - permit always valid',
        recommendation: 'No action required'
      });
      continue;
    }

    const reciprocity = await checkReciprocity(client, permitHolderState, travelState);
    
    if (!reciprocity) {
      // No reciprocity data - check if it's a constitutional carry state
      const ccCheck = await client.query(`
        SELECT r.category, r.is_restricted, r.permit_required
        FROM regulations r
        JOIN jurisdictions j ON r.jurisdiction_id = j.id
        WHERE j.postal_code = $1 
          AND j.type = 'state'
          AND r.category = 'concealed_carry'
      `, [travelState]);

      if (ccCheck.rows.length > 0 && !ccCheck.rows[0].permit_required) {
        // Constitutional carry state
        analysis.recognition_summary.recognized.push(travelState);
        analysis.detailed_analysis.push({
          state: travelState,
          recognition_type: 'full',
          notes: 'Constitutional carry state - no permit required',
          recommendation: 'Follow state firearms laws; permit not required'
        });
      } else {
        // Unknown - assume not recognized
        analysis.recognition_summary.not_recognized.push(travelState);
        analysis.detailed_analysis.push({
          state: travelState,
          recognition_type: 'none',
          notes: 'Reciprocity unknown - verify current status',
          recommendation: 'Check current reciprocity status with state authorities'
        });
      }
      continue;
    }

    // Process known reciprocity
    switch (reciprocity.recognition_type) {
      case 'full':
        analysis.recognition_summary.recognized.push(travelState);
        analysis.detailed_analysis.push({
          state: travelState,
          recognition_type: 'full',
          notes: reciprocity.notes,
          recommendation: 'Permit recognized - follow local carrying laws'
        });
        break;
      
      case 'partial':
        analysis.recognition_summary.partial_recognition.push(travelState);
        analysis.detailed_analysis.push({
          state: travelState,
          recognition_type: 'partial',
          notes: reciprocity.notes,
          recommendation: 'Limited recognition - review specific restrictions'
        });
        break;
      
      case 'resident_only':
        analysis.recognition_summary.resident_only.push(travelState);
        analysis.detailed_analysis.push({
          state: travelState,
          recognition_type: 'resident_only',
          notes: reciprocity.notes,
          recommendation: 'Only recognizes resident permits - consider alternative transport'
        });
        break;
      
      case 'none':
      default:
        analysis.recognition_summary.not_recognized.push(travelState);
        analysis.detailed_analysis.push({
          state: travelState,
          recognition_type: 'none',
          notes: reciprocity.notes,
          recommendation: 'Permit not recognized - use locked transport or avoid carrying'
        });
        break;
    }
  }

  // Generate overall recommendations
  if (analysis.recognition_summary.not_recognized.length > 0) {
    analysis.recommendations.push(
      `Your permit is not recognized in ${analysis.recognition_summary.not_recognized.length} states. Consider locked transport in these areas.`
    );
  }
  
  if (analysis.recognition_summary.partial_recognition.length > 0) {
    analysis.recommendations.push(
      `Review specific restrictions in ${analysis.recognition_summary.partial_recognition.join(', ')} for partial recognition.`
    );
  }
  
  if (analysis.recognition_summary.recognized.length === travelStates.length) {
    analysis.recommendations.push(
      'Excellent! Your permit is recognized in all travel destinations.'
    );
  }

  return analysis;
}

/**
 * Get reciprocity map for a specific state's permits
 */
export async function getReciprocityMap(
  client: PoolClient,
  issuingState: string
): Promise<Array<{
  state: string;
  state_name: string;
  recognition_type: string;
  notes: string | null;
  last_verified: string;
}>> {
  const result = await client.query(`
    SELECT 
      recognizing.postal_code as state,
      recognizing.name as state_name,
      ir.recognition_type,
      ir.notes,
      ir.last_verified
    FROM interstate_reciprocity ir
    JOIN jurisdictions issuing ON ir.issuing_state_id = issuing.id
    JOIN jurisdictions recognizing ON ir.recognizing_state_id = recognizing.id
    WHERE issuing.postal_code = $1
      AND issuing.type = 'state'
      AND recognizing.type = 'state'
    ORDER BY recognizing.postal_code
  `, [issuingState]);

  return result.rows;
}

/**
 * Update reciprocity status between two states
 */
export async function updateReciprocity(
  client: PoolClient,
  issuingState: string,
  recognizingState: string,
  recognitionType: 'full' | 'partial' | 'resident_only' | 'none',
  permitTypes: Record<string, any> = {},
  restrictions: Record<string, any> | null = null,
  notes: string | null = null,
  effectiveDate: string | null = null
): Promise<void> {
  await client.query(`
    INSERT INTO interstate_reciprocity (
      issuing_state_id, recognizing_state_id, recognition_type,
      permit_types, restrictions, notes, effective_date, last_verified
    ) VALUES (
      (SELECT id FROM jurisdictions WHERE postal_code = $1 AND type = 'state'),
      (SELECT id FROM jurisdictions WHERE postal_code = $2 AND type = 'state'),
      $3, $4, $5, $6, $7, CURRENT_DATE
    )
    ON CONFLICT (issuing_state_id, recognizing_state_id) 
    DO UPDATE SET
      recognition_type = EXCLUDED.recognition_type,
      permit_types = EXCLUDED.permit_types,
      restrictions = EXCLUDED.restrictions,
      notes = EXCLUDED.notes,
      effective_date = EXCLUDED.effective_date,
      last_verified = CURRENT_DATE,
      updated_at = CURRENT_TIMESTAMP
  `, [issuingState, recognizingState, recognitionType, JSON.stringify(permitTypes), 
      restrictions ? JSON.stringify(restrictions) : null, notes, effectiveDate]);
}

/**
 * Get states that need reciprocity verification (old data)
 */
export async function getStaleReciprocityRecords(
  client: PoolClient,
  thresholdDays: number = 365
): Promise<Array<{
  issuing_state: string;
  recognizing_state: string;
  last_verified: string;
  days_since_verified: number;
}>> {
  const result = await client.query(`
    SELECT 
      issuing.postal_code as issuing_state,
      recognizing.postal_code as recognizing_state,
      ir.last_verified,
      EXTRACT(days FROM (CURRENT_DATE - ir.last_verified)) as days_since_verified
    FROM interstate_reciprocity ir
    JOIN jurisdictions issuing ON ir.issuing_state_id = issuing.id
    JOIN jurisdictions recognizing ON ir.recognizing_state_id = recognizing.id
    WHERE ir.last_verified < (CURRENT_DATE - INTERVAL '${thresholdDays} days')
    ORDER BY ir.last_verified ASC
  `);

  return result.rows.map(row => ({
    ...row,
    days_since_verified: parseInt(row.days_since_verified)
  }));
}
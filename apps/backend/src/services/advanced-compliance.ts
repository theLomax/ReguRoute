/**
 * Advanced Compliance Engine
 * 
 * Integrates all compliance systems for comprehensive route analysis:
 * - State regulations (firearm laws, magazine restrictions, etc.)
 * - Interstate reciprocity (concealed carry permits)
 * - NFA item compliance (suppressors, SBRs, etc.)
 * - Local ordinances (city/county laws)
 * - Equipment-specific compliance checking
 */

import type { PoolClient } from 'pg';
import type { CargoProfile } from '@reguroute/types';
import { 
  analyzeRoute as analyzeStateRoute,
  getAvoidancePolygons as getStateAvoidancePolygons,
  type RouteAnalysis as StateRouteAnalysis,
  type RegulationAlert
} from './regulations.js';
import {
  analyzeRouteReciprocity,
  type ReciprocityAnalysis
} from './reciprocity.js';
import {
  analyzeNfaRoute,
  type NfaRouteAnalysis,
  type NfaComplianceAlert
} from './nfa.js';
import {
  analyzeLocalOrdinanceRoute,
  type LocalOrdinanceAnalysis,
  type LocalComplianceAlert
} from './local-ordinances.js';

export interface ComprehensiveCargoProfile extends CargoProfile {
  // Enhanced cargo profile with all system capabilities
  user_id?: string;
  permit_holder_state?: string;
  permit_class?: 'standard' | 'enhanced' | 'provisional' | 'non_resident' | 'lifetime' | 'military';
  nfa_items?: Array<{
    item_type: string;
    manufacturer?: string;
    model?: string;
  }>;
  equipment_items?: Array<{
    category: string;
    features?: string[];
    ammunition_capacity?: number;
  }>;
}

export interface UnifiedComplianceAlert {
  id: string;
  jurisdiction: string;
  jurisdiction_type: 'state' | 'city' | 'county';
  postal_code: string;
  alert_source: 'state_regulation' | 'reciprocity' | 'nfa_regulation' | 'local_ordinance';
  category: string;
  severity: 'info' | 'warning' | 'critical';
  priority_score: number; // 1-10, higher = more important
  message: string;
  short_description: string;
  detailed_requirements?: Record<string, any>;
  affected_items?: string[];
  legal_citations?: string[];
  recommendations: string[];
  alternative_actions?: string[];
  compliance_deadline?: string;
  enforcement_likelihood: 'low' | 'medium' | 'high';
  traveler_impact: 'minimal' | 'moderate' | 'significant' | 'severe';
  route_position?: number;
  effective_date?: string;
  last_verified?: string;
  is_stale?: boolean;
  preemption_status?: string;
}

export interface ComprehensiveRouteAnalysis {
  route_summary: {
    total_jurisdictions: number;
    states_crossed: number;
    cities_with_ordinances: number;
    total_alerts: number;
    critical_alerts: number;
    warning_alerts: number;
    info_alerts: number;
    route_feasibility: 'recommended' | 'caution' | 'high_risk' | 'avoid';
    overall_compliance_score: number; // 1-100
  };
  
  alerts_by_system: {
    state_regulations: StateRouteAnalysis;
    reciprocity_analysis: ReciprocityAnalysis | null;
    nfa_compliance: NfaRouteAnalysis | null;
    local_ordinances: LocalOrdinanceAnalysis;
  };
  
  unified_alerts: UnifiedComplianceAlert[];
  
  critical_issues: {
    prohibited_items: Array<{
      item: string;
      jurisdictions: string[];
      severity: string;
    }>;
    permit_recognition_failures: Array<{
      permit_state: string;
      non_recognition_states: string[];
    }>;
    mandatory_compliance_actions: string[];
  };
  
  recommendations: {
    route_modifications: string[];
    equipment_adjustments: string[];
    legal_preparations: string[];
    alternative_transport: string[];
  };
  
  avoidance_zones?: {
    avoid_polygons: GeoJSON.MultiPolygon | null;
    restricted_jurisdictions: Array<{
      name: string;
      postal_code: string;
      reasons: string[];
    }>;
  };
}

/**
 * Comprehensive route compliance analysis integrating all systems
 */
export async function analyzeComprehensiveCompliance(
  client: PoolClient,
  routeGeometry: GeoJSON.LineString,
  cargoProfile: ComprehensiveCargoProfile
): Promise<ComprehensiveRouteAnalysis> {
  console.log('🔄 Starting comprehensive compliance analysis...');
  
  // Run all compliance analyses in parallel
  const [stateAnalysis, reciprocityAnalysis, nfaAnalysis, localAnalysis, avoidanceData] = await Promise.all([
    // State-level regulations
    analyzeStateRoute(client, routeGeometry, cargoProfile),
    
    // Reciprocity analysis (if applicable)
    cargoProfile.permit_holder_state ? 
      analyzeReciprocityForRoute(client, routeGeometry, cargoProfile) : 
      Promise.resolve(null),
    
    // NFA analysis (if applicable)
    cargoProfile.user_id ? 
      analyzeNfaRoute(client, cargoProfile.user_id, await getJurisdictionIdsFromRoute(client, routeGeometry)) : 
      Promise.resolve(null),
    
    // Local ordinances
    analyzeLocalOrdinanceRoute(client, routeGeometry, cargoProfile),
    
    // Avoidance polygons for routing
    getStateAvoidancePolygons(client, cargoProfile)
  ]);

  console.log('✅ All analyses completed');

  // Unify alerts from all systems
  const unifiedAlerts = await unifyComplianceAlerts(
    stateAnalysis,
    reciprocityAnalysis,
    nfaAnalysis,
    localAnalysis
  );

  // Calculate route feasibility and compliance score
  const routeFeasibility = calculateRouteFeasibility(unifiedAlerts);
  const complianceScore = calculateComplianceScore(unifiedAlerts, stateAnalysis.jurisdictions_crossed.length);

  // Generate critical issues summary
  const criticalIssues = extractCriticalIssues(unifiedAlerts, nfaAnalysis, reciprocityAnalysis);

  // Generate comprehensive recommendations
  const recommendations = generateComprehensiveRecommendations(
    unifiedAlerts,
    stateAnalysis,
    reciprocityAnalysis,
    nfaAnalysis,
    localAnalysis
  );

  return {
    route_summary: {
      total_jurisdictions: stateAnalysis.jurisdictions_crossed.length + (localAnalysis.jurisdictions_with_ordinances?.length || 0),
      states_crossed: stateAnalysis.jurisdictions_crossed.length,
      cities_with_ordinances: localAnalysis.summary.cities_with_restrictions + localAnalysis.summary.counties_with_restrictions,
      total_alerts: unifiedAlerts.length,
      critical_alerts: unifiedAlerts.filter(a => a.severity === 'critical').length,
      warning_alerts: unifiedAlerts.filter(a => a.severity === 'warning').length,
      info_alerts: unifiedAlerts.filter(a => a.severity === 'info').length,
      route_feasibility: routeFeasibility,
      overall_compliance_score: complianceScore
    },
    
    alerts_by_system: {
      state_regulations: stateAnalysis,
      reciprocity_analysis: reciprocityAnalysis,
      nfa_compliance: nfaAnalysis,
      local_ordinances: localAnalysis
    },
    
    unified_alerts: unifiedAlerts,
    critical_issues: criticalIssues,
    recommendations,
    avoidance_zones: {
      avoid_polygons: avoidanceData.avoidPolygons,
      restricted_jurisdictions: avoidanceData.restrictedJurisdictions
    }
  };
}

/**
 * Get jurisdiction IDs from route geometry
 */
async function getJurisdictionIdsFromRoute(
  client: PoolClient,
  routeGeometry: GeoJSON.LineString
): Promise<string[]> {
  const result = await client.query(
    `WITH route_line AS (
       SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom
     )
     SELECT j.id
     FROM jurisdictions j, route_line rl
     WHERE j.type = 'state'
       AND j.geometry IS NOT NULL
       AND ST_Intersects(j.geometry, rl.geom)`,
    [JSON.stringify(routeGeometry)]
  );
  
  return result.rows.map(row => row.id);
}

/**
 * Analyze reciprocity for route
 */
async function analyzeReciprocityForRoute(
  client: PoolClient,
  routeGeometry: GeoJSON.LineString,
  cargoProfile: ComprehensiveCargoProfile
): Promise<ReciprocityAnalysis | null> {
  if (!cargoProfile.permit_holder_state || !cargoProfile.has_concealed_carry_permit) {
    return null;
  }

  // Get states on route
  const statesResult = await client.query(
    `WITH route_line AS (
       SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom
     )
     SELECT j.postal_code
     FROM jurisdictions j, route_line rl
     WHERE j.type = 'state'
       AND j.geometry IS NOT NULL
       AND ST_Intersects(j.geometry, rl.geom)`,
    [JSON.stringify(routeGeometry)]
  );

  const travelStates = statesResult.rows.map(row => row.postal_code);
  
  return await analyzeRouteReciprocity(
    client,
    cargoProfile.permit_holder_state,
    travelStates,
    cargoProfile.permit_class || 'standard'
  );
}

/**
 * Unify alerts from all compliance systems
 */
async function unifyComplianceAlerts(
  stateAnalysis: StateRouteAnalysis,
  reciprocityAnalysis: ReciprocityAnalysis | null,
  nfaAnalysis: NfaRouteAnalysis | null,
  localAnalysis: LocalOrdinanceAnalysis
): Promise<UnifiedComplianceAlert[]> {
  const unifiedAlerts: UnifiedComplianceAlert[] = [];
  let alertIdCounter = 1;

  // Process state regulation alerts
  for (const alert of stateAnalysis.alerts) {
    unifiedAlerts.push({
      id: `state-${alertIdCounter++}`,
      jurisdiction: alert.jurisdiction,
      jurisdiction_type: 'state',
      postal_code: alert.postal_code,
      alert_source: 'state_regulation',
      category: alert.category,
      severity: alert.severity,
      priority_score: calculatePriorityScore(alert.severity, 'state_regulation', alert.category),
      message: alert.message,
      short_description: alert.category,
      detailed_requirements: alert.requirements,
      affected_items: extractAffectedItems(alert.message),
      legal_citations: alert.citation ? [alert.citation] : [],
      recommendations: generateStateRecommendations(alert),
      alternative_actions: [],
      enforcement_likelihood: 'high',
      traveler_impact: mapSeverityToImpact(alert.severity),
      effective_date: alert.effective_date || undefined,
      last_verified: alert.last_verified || undefined,
      is_stale: alert.is_stale
    });
  }

  // Process reciprocity alerts
  if (reciprocityAnalysis) {
    for (const detail of reciprocityAnalysis.detailed_analysis) {
      const severity: 'info' | 'warning' | 'critical' = 
        detail.recognition_type === 'none' ? 'critical' :
        detail.recognition_type === 'partial' || detail.recognition_type === 'resident_only' ? 'warning' : 'info';

      unifiedAlerts.push({
        id: `reciprocity-${alertIdCounter++}`,
        jurisdiction: detail.state,
        jurisdiction_type: 'state',
        postal_code: detail.state,
        alert_source: 'reciprocity',
        category: 'Permit Recognition',
        severity,
        priority_score: calculatePriorityScore(severity, 'reciprocity', 'Permit Recognition'),
        message: `Permit recognition: ${detail.recognition_type}. ${detail.recommendation}`,
        short_description: `${detail.recognition_type} recognition`,
        affected_items: ['concealed_carry_permit'],
        recommendations: [detail.recommendation],
        alternative_actions: detail.recognition_type === 'none' ? ['Use locked transport', 'Avoid carrying in this state'] : [],
        enforcement_likelihood: detail.recognition_type === 'none' ? 'high' : 'medium',
        traveler_impact: severity === 'critical' ? 'severe' : 'moderate'
      });
    }
  }

  // Process NFA alerts
  if (nfaAnalysis) {
    for (const alert of nfaAnalysis.alerts) {
      unifiedAlerts.push({
        id: `nfa-${alertIdCounter++}`,
        jurisdiction: alert.jurisdiction,
        jurisdiction_type: 'state',
        postal_code: alert.postal_code,
        alert_source: 'nfa_regulation',
        category: alert.category,
        severity: alert.severity,
        priority_score: calculatePriorityScore(alert.severity, 'nfa_regulation', alert.item_type),
        message: alert.message,
        short_description: `${alert.item_type.toUpperCase()} - ${alert.category}`,
        detailed_requirements: alert.requirements,
        affected_items: [alert.item_type],
        legal_citations: alert.citation ? [alert.citation] : [],
        recommendations: alert.recommendations,
        alternative_actions: alert.severity === 'critical' ? ['Avoid this jurisdiction', 'Use alternate route'] : [],
        enforcement_likelihood: 'high',
        traveler_impact: mapSeverityToImpact(alert.severity),
        effective_date: alert.effective_date || undefined,
        last_verified: alert.last_verified || undefined
      });
    }
  }

  // Process local ordinance alerts
  for (const alert of localAnalysis.alerts) {
    unifiedAlerts.push({
      id: `local-${alertIdCounter++}`,
      jurisdiction: alert.jurisdiction,
      jurisdiction_type: alert.jurisdiction_type as 'city' | 'county',
      postal_code: alert.postal_code,
      alert_source: 'local_ordinance',
      category: alert.category,
      severity: alert.severity,
      priority_score: calculatePriorityScore(alert.severity, 'local_ordinance', alert.ordinance_type),
      message: alert.message,
      short_description: `${alert.ordinance_type.replace(/_/g, ' ')} ordinance`,
      detailed_requirements: alert.requirements,
      affected_items: [alert.ordinance_type],
      legal_citations: alert.ordinance_citation ? [alert.ordinance_citation] : [],
      recommendations: alert.recommendations,
      alternative_actions: [],
      enforcement_likelihood: alert.preemption_status === 'preempted' ? 'low' : 'medium',
      traveler_impact: alert.preemption_status === 'preempted' ? 'minimal' : mapSeverityToImpact(alert.severity),
      effective_date: alert.effective_date || undefined,
      last_verified: alert.last_verified || undefined,
      preemption_status: alert.preemption_status
    });
  }

  // Sort by priority score (highest first)
  return unifiedAlerts.sort((a, b) => b.priority_score - a.priority_score);
}

/**
 * Calculate priority score for alert ordering
 */
function calculatePriorityScore(
  severity: 'info' | 'warning' | 'critical',
  source: string,
  category: string
): number {
  const severityScore = { critical: 10, warning: 6, info: 3 };
  const sourceScore: Record<string, number> = { state_regulation: 4, nfa_regulation: 4, reciprocity: 3, local_ordinance: 2 };
  const categoryBonus = category.includes('prohibited') || category.includes('Prohibited') ? 2 : 0;
  
  return severityScore[severity] + (sourceScore[source] || 1) + categoryBonus;
}

/**
 * Extract affected items from alert message
 */
function extractAffectedItems(message: string): string[] {
  const items: string[] = [];
  const itemKeywords = ['suppressor', 'sbr', 'sbs', 'machine gun', 'handgun', 'rifle', 'shotgun', 'magazine', 'ammunition'];
  
  for (const keyword of itemKeywords) {
    if (message.toLowerCase().includes(keyword)) {
      items.push(keyword);
    }
  }
  
  return items.length > 0 ? items : ['firearms'];
}

/**
 * Generate state-specific recommendations
 */
function generateStateRecommendations(alert: RegulationAlert): string[] {
  const recommendations: string[] = [];
  
  if (alert.category.includes('Ammunition') || alert.category.includes('Magazine')) {
    recommendations.push('Consider using lower-capacity magazines');
    recommendations.push('Transport ammunition separately');
  }
  
  if (alert.category.includes('Concealed Carry')) {
    recommendations.push('Review permit recognition status');
    recommendations.push('Consider applying for local permit');
  }
  
  if (alert.category.includes('Transport')) {
    recommendations.push('Use locked containers');
    recommendations.push('Follow FOPA safe passage provisions');
  }
  
  recommendations.push('Verify current laws before travel');
  return recommendations;
}

/**
 * Map severity to traveler impact
 */
function mapSeverityToImpact(severity: 'info' | 'warning' | 'critical'): 'minimal' | 'moderate' | 'significant' | 'severe' {
  switch (severity) {
    case 'critical': return 'severe';
    case 'warning': return 'significant';
    case 'info': return 'moderate';
    default: return 'minimal';
  }
}

/**
 * Calculate route feasibility based on alerts
 */
function calculateRouteFeasibility(alerts: UnifiedComplianceAlert[]): 'recommended' | 'caution' | 'high_risk' | 'avoid' {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const warningAlerts = alerts.filter(a => a.severity === 'warning').length;
  const prohibitedItems = alerts.filter(a => a.message.toLowerCase().includes('prohibited')).length;

  if (prohibitedItems > 0 || criticalAlerts >= 3) {
    return 'avoid';
  } else if (criticalAlerts >= 1) {
    return 'high_risk';
  } else if (warningAlerts >= 3) {
    return 'caution';
  } else {
    return 'recommended';
  }
}

/**
 * Calculate overall compliance score (1-100)
 */
function calculateComplianceScore(alerts: UnifiedComplianceAlert[], totalJurisdictions: number): number {
  if (totalJurisdictions === 0) return 100;

  const criticalPenalty = alerts.filter(a => a.severity === 'critical').length * 15;
  const warningPenalty = alerts.filter(a => a.severity === 'warning').length * 8;
  const infoPenalty = alerts.filter(a => a.severity === 'info').length * 3;
  
  const totalPenalty = criticalPenalty + warningPenalty + infoPenalty;
  const score = Math.max(0, 100 - totalPenalty);
  
  return Math.round(score);
}

/**
 * Extract critical issues for summary
 */
function extractCriticalIssues(
  alerts: UnifiedComplianceAlert[],
  nfaAnalysis: NfaRouteAnalysis | null,
  reciprocityAnalysis: ReciprocityAnalysis | null
): ComprehensiveRouteAnalysis['critical_issues'] {
  const prohibitedItems: Array<{ item: string; jurisdictions: string[]; severity: string }> = [];
  const permitFailures: Array<{ permit_state: string; non_recognition_states: string[] }> = [];
  const mandatoryActions: string[] = [];

  // Find prohibited items
  const prohibitedAlerts = alerts.filter(a => 
    a.severity === 'critical' && 
    (a.message.toLowerCase().includes('prohibited') || a.message.toLowerCase().includes('ban'))
  );

  const prohibitedByItem: Record<string, string[]> = {};
  for (const alert of prohibitedAlerts) {
    for (const item of alert.affected_items || []) {
      if (!prohibitedByItem[item]) prohibitedByItem[item] = [];
      prohibitedByItem[item].push(alert.jurisdiction);
    }
  }

  for (const [item, jurisdictions] of Object.entries(prohibitedByItem)) {
    prohibitedItems.push({
      item,
      jurisdictions,
      severity: 'critical'
    });
  }

  // Find permit recognition failures
  if (reciprocityAnalysis) {
    const nonRecognitionStates = reciprocityAnalysis.recognition_summary.not_recognized;
    if (nonRecognitionStates.length > 0) {
      permitFailures.push({
        permit_state: reciprocityAnalysis.permit_holder_state,
        non_recognition_states: nonRecognitionStates
      });
    }
  }

  // Generate mandatory actions
  if (prohibitedItems.length > 0) {
    mandatoryActions.push('Remove or avoid carrying prohibited items');
    mandatoryActions.push('Consider alternate route avoiding restricted jurisdictions');
  }

  if (permitFailures.length > 0) {
    mandatoryActions.push('Obtain additional permits or use locked transport');
  }

  const storageRequirements = alerts.filter(a => 
    a.category.toLowerCase().includes('storage') || 
    a.category.toLowerCase().includes('transport')
  );
  
  if (storageRequirements.length > 0) {
    mandatoryActions.push('Ensure proper storage and transport containers');
  }

  return {
    prohibited_items: prohibitedItems,
    permit_recognition_failures: permitFailures,
    mandatory_compliance_actions: mandatoryActions
  };
}

/**
 * Generate comprehensive recommendations
 */
function generateComprehensiveRecommendations(
  alerts: UnifiedComplianceAlert[],
  stateAnalysis: StateRouteAnalysis,
  reciprocityAnalysis: ReciprocityAnalysis | null,
  nfaAnalysis: NfaRouteAnalysis | null,
  localAnalysis: LocalOrdinanceAnalysis
): ComprehensiveRouteAnalysis['recommendations'] {
  const routeModifications: string[] = [];
  const equipmentAdjustments: string[] = [];
  const legalPreparations: string[] = [];
  const alternativeTransport: string[] = [];

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  // Route modifications
  if (criticalAlerts.length > 0) {
    routeModifications.push('Consider alternate route avoiding critical restriction areas');
    
    const restrictedStates = [...new Set(criticalAlerts.map(a => a.postal_code))];
    if (restrictedStates.length > 0) {
      routeModifications.push(`High-risk states: ${restrictedStates.join(', ')}`);
    }
  }

  if (localAnalysis.summary.active_ordinances > 0) {
    routeModifications.push('Plan stops outside city limits where possible');
  }

  // Equipment adjustments
  const magazineAlerts = alerts.filter(a => a.message.toLowerCase().includes('magazine') || a.message.toLowerCase().includes('capacity'));
  if (magazineAlerts.length > 0) {
    equipmentAdjustments.push('Use lower-capacity magazines for travel');
    equipmentAdjustments.push('Consider state-compliant ammunition feeding devices');
  }

  if (nfaAnalysis && nfaAnalysis.summary.prohibited_jurisdictions > 0) {
    equipmentAdjustments.push('Leave NFA items in compliant jurisdictions');
    equipmentAdjustments.push('Consider shipping NFA items separately via FFL');
  }

  // Legal preparations
  legalPreparations.push('Carry all relevant permits and documentation');
  legalPreparations.push('Research current laws in destination states');
  
  if (reciprocityAnalysis && reciprocityAnalysis.recognition_summary.not_recognized.length > 0) {
    legalPreparations.push('Consider applying for non-resident permits');
  }

  if (warningAlerts.length > 0) {
    legalPreparations.push('Consult legal counsel for complex compliance situations');
  }

  // Alternative transport
  if (criticalAlerts.length > 0) {
    alternativeTransport.push('Use locked containers meeting FOPA requirements');
    alternativeTransport.push('Consider common carrier shipping for prohibited items');
    alternativeTransport.push('Ship via licensed firearms dealer (FFL)');
  }

  return {
    route_modifications: routeModifications,
    equipment_adjustments: equipmentAdjustments,
    legal_preparations: legalPreparations,
    alternative_transport: alternativeTransport
  };
}

/**
 * Generate compliance summary report
 */
export async function generateComplianceSummaryReport(
  client: PoolClient,
  analysis: ComprehensiveRouteAnalysis
): Promise<{
  executive_summary: string;
  risk_assessment: string;
  priority_actions: string[];
  legal_disclaimers: string[];
}> {
  const { route_summary, critical_issues, recommendations } = analysis;
  
  // Executive summary
  let executiveSummary = `Route compliance analysis for ${route_summary.states_crossed} states `;
  executiveSummary += `shows ${route_summary.route_feasibility} feasibility `;
  executiveSummary += `with ${route_summary.critical_alerts} critical and ${route_summary.warning_alerts} warning alerts. `;
  executiveSummary += `Overall compliance score: ${route_summary.overall_compliance_score}/100.`;

  // Risk assessment
  let riskAssessment = '';
  if (route_summary.route_feasibility === 'avoid') {
    riskAssessment = 'HIGH RISK: Route contains jurisdictions with prohibited items or severe restrictions. Alternative route strongly recommended.';
  } else if (route_summary.route_feasibility === 'high_risk') {
    riskAssessment = 'HIGH RISK: Multiple critical compliance issues identified. Careful planning and legal consultation required.';
  } else if (route_summary.route_feasibility === 'caution') {
    riskAssessment = 'MODERATE RISK: Several restrictions apply. Review compliance requirements carefully.';
  } else {
    riskAssessment = 'LOW RISK: Route generally compliant with minor restrictions. Follow standard travel protocols.';
  }

  // Priority actions
  const priorityActions = [
    ...critical_issues.mandatory_compliance_actions,
    ...recommendations.route_modifications.slice(0, 2),
    ...recommendations.legal_preparations.slice(0, 2)
  ].slice(0, 5);

  // Legal disclaimers
  const legalDisclaimers = [
    'This analysis is for informational purposes only and does not constitute legal advice.',
    'Firearm laws change frequently. Verify current regulations before travel.',
    'Consult qualified legal counsel for specific compliance questions.',
    'Traveler is solely responsible for compliance with all applicable laws.',
    'Analysis based on available data which may not reflect the most current legal status.'
  ];

  return {
    executive_summary: executiveSummary,
    risk_assessment: riskAssessment,
    priority_actions: priorityActions,
    legal_disclaimers: legalDisclaimers
  };
}
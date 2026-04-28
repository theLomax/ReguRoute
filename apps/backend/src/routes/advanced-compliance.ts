/**
 * Advanced Compliance Engine API Routes
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  analyzeComprehensiveCompliance,
  generateComplianceSummaryReport,
  type ComprehensiveCargoProfile,
  type ComprehensiveRouteAnalysis
} from '../services/advanced-compliance.js';

interface ComprehensiveAnalysisBody {
  route_geometry: GeoJSON.LineString;
  cargo_profile: ComprehensiveCargoProfile;
  analysis_options?: {
    include_nfa?: boolean;
    include_reciprocity?: boolean;
    include_local_ordinances?: boolean;
    priority_threshold?: 'critical' | 'warning' | 'info';
    generate_avoidance_zones?: boolean;
  };
}

interface RouteOptimizationBody extends ComprehensiveAnalysisBody {
  optimization_preferences: {
    avoid_prohibited_items?: boolean;
    minimize_permit_issues?: boolean;
    prefer_permissive_states?: boolean;
    avoid_major_cities?: boolean;
  };
}

export async function advancedComplianceRoutes(fastify: FastifyInstance) {
  // Comprehensive compliance analysis - main endpoint
  fastify.post<{
    Body: ComprehensiveAnalysisBody;
  }>('/analyze', async (request: FastifyRequest<{
    Body: ComprehensiveAnalysisBody;
  }>, reply: FastifyReply) => {
    const { route_geometry, cargo_profile, analysis_options } = request.body;

    if (!route_geometry || route_geometry.type !== 'LineString') {
      return reply.status(400).send({
        error: 'Valid route_geometry (GeoJSON LineString) is required'
      });
    }

    if (!cargo_profile) {
      return reply.status(400).send({
        error: 'cargo_profile is required'
      });
    }

    try {
      const startTime = Date.now();
      
      const client = await fastify.pg.connect();
      const analysis = await analyzeComprehensiveCompliance(
        client,
        route_geometry,
        cargo_profile
      );
      client.release();

      const processingTime = Date.now() - startTime;

      // Filter alerts by priority threshold if specified
      if (analysis_options?.priority_threshold) {
        const thresholds = { critical: ['critical'], warning: ['critical', 'warning'], info: ['critical', 'warning', 'info'] };
        const allowedSeverities = thresholds[analysis_options.priority_threshold];
        analysis.unified_alerts = analysis.unified_alerts.filter(alert => 
          allowedSeverities.includes(alert.severity)
        );
      }

      return reply.send({
        ...analysis,
        analysis_metadata: {
          processing_time_ms: processingTime,
          analysis_timestamp: new Date().toISOString(),
          systems_analyzed: [
            'state_regulations',
            cargo_profile.permit_holder_state ? 'reciprocity' : null,
            cargo_profile.user_id ? 'nfa_compliance' : null,
            'local_ordinances'
          ].filter(Boolean),
          api_version: '1.0'
        }
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error in comprehensive compliance analysis');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to complete compliance analysis'
      });
    }
  });

  // Compliance summary report
  fastify.post<{
    Body: ComprehensiveAnalysisBody;
  }>('/summary-report', async (request: FastifyRequest<{
    Body: ComprehensiveAnalysisBody;
  }>, reply: FastifyReply) => {
    const { route_geometry, cargo_profile } = request.body;

    if (!route_geometry || route_geometry.type !== 'LineString') {
      return reply.status(400).send({
        error: 'Valid route_geometry (GeoJSON LineString) is required'
      });
    }

    try {
      const client = await fastify.pg.connect();
      const analysis = await analyzeComprehensiveCompliance(
        client,
        route_geometry,
        cargo_profile
      );
      
      const summaryReport = await generateComplianceSummaryReport(client, analysis);
      client.release();

      return reply.send({
        route_summary: analysis.route_summary,
        compliance_report: summaryReport,
        critical_alerts_count: analysis.unified_alerts.filter(a => a.severity === 'critical').length,
        top_priority_alerts: analysis.unified_alerts.slice(0, 5).map(alert => ({
          id: alert.id,
          jurisdiction: alert.jurisdiction,
          severity: alert.severity,
          category: alert.category,
          short_description: alert.short_description,
          priority_score: alert.priority_score
        })),
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error generating summary report');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Compliance alerts by jurisdiction
  fastify.post<{
    Body: ComprehensiveAnalysisBody;
  }>('/alerts-by-jurisdiction', async (request: FastifyRequest<{
    Body: ComprehensiveAnalysisBody;
  }>, reply: FastifyReply) => {
    const { route_geometry, cargo_profile } = request.body;

    try {
      const client = await fastify.pg.connect();
      const analysis = await analyzeComprehensiveCompliance(
        client,
        route_geometry,
        cargo_profile
      );
      client.release();

      // Group alerts by jurisdiction
      const alertsByJurisdiction: Record<string, any[]> = {};
      
      for (const alert of analysis.unified_alerts) {
        const key = `${alert.postal_code}-${alert.jurisdiction_type}`;
        if (!alertsByJurisdiction[key]) {
          alertsByJurisdiction[key] = [];
        }
        alertsByJurisdiction[key].push(alert);
      }

      // Convert to structured format
      const structuredAlerts = Object.entries(alertsByJurisdiction).map(([key, alerts]) => {
        const sample = alerts[0];
        return {
          jurisdiction: sample.jurisdiction,
          jurisdiction_type: sample.jurisdiction_type,
          postal_code: sample.postal_code,
          alert_count: alerts.length,
          critical_count: alerts.filter(a => a.severity === 'critical').length,
          warning_count: alerts.filter(a => a.severity === 'warning').length,
          info_count: alerts.filter(a => a.severity === 'info').length,
          highest_priority_score: Math.max(...alerts.map(a => a.priority_score)),
          alert_sources: [...new Set(alerts.map(a => a.alert_source))],
          alerts: alerts.sort((a, b) => b.priority_score - a.priority_score)
        };
      });

      // Sort by highest priority score
      structuredAlerts.sort((a, b) => b.highest_priority_score - a.highest_priority_score);

      return reply.send({
        total_jurisdictions: structuredAlerts.length,
        jurisdictions_with_alerts: structuredAlerts,
        summary: {
          total_alerts: analysis.unified_alerts.length,
          critical_alerts: analysis.unified_alerts.filter(a => a.severity === 'critical').length,
          warning_alerts: analysis.unified_alerts.filter(a => a.severity === 'warning').length,
          info_alerts: analysis.unified_alerts.filter(a => a.severity === 'info').length
        }
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error grouping alerts by jurisdiction');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Compliance score breakdown
  fastify.post<{
    Body: ComprehensiveAnalysisBody;
  }>('/compliance-score', async (request: FastifyRequest<{
    Body: ComprehensiveAnalysisBody;
  }>, reply: FastifyReply) => {
    const { route_geometry, cargo_profile } = request.body;

    try {
      const client = await fastify.pg.connect();
      const analysis = await analyzeComprehensiveCompliance(
        client,
        route_geometry,
        cargo_profile
      );
      client.release();

      // Calculate detailed score breakdown
      const scoreBreakdown = {
        overall_score: analysis.route_summary.overall_compliance_score,
        base_score: 100,
        deductions: {
          critical_alerts: analysis.unified_alerts.filter(a => a.severity === 'critical').length * 15,
          warning_alerts: analysis.unified_alerts.filter(a => a.severity === 'warning').length * 8,
          info_alerts: analysis.unified_alerts.filter(a => a.severity === 'info').length * 3
        },
        score_by_system: {
          state_regulations: calculateSystemScore(analysis.unified_alerts.filter(a => a.alert_source === 'state_regulation')),
          nfa_compliance: calculateSystemScore(analysis.unified_alerts.filter(a => a.alert_source === 'nfa_regulation')),
          reciprocity: calculateSystemScore(analysis.unified_alerts.filter(a => a.alert_source === 'reciprocity')),
          local_ordinances: calculateSystemScore(analysis.unified_alerts.filter(a => a.alert_source === 'local_ordinance'))
        },
        feasibility_assessment: analysis.route_summary.route_feasibility,
        risk_factors: extractRiskFactors(analysis.unified_alerts)
      };

      return reply.send(scoreBreakdown);
    } catch (error) {
      fastify.log.error({ error }, 'Error calculating compliance score');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Route optimization suggestions
  fastify.post<{
    Body: RouteOptimizationBody;
  }>('/optimize-route', async (request: FastifyRequest<{
    Body: RouteOptimizationBody;
  }>, reply: FastifyReply) => {
    const { route_geometry, cargo_profile, optimization_preferences } = request.body;

    try {
      const client = await fastify.pg.connect();
      const analysis = await analyzeComprehensiveCompliance(
        client,
        route_geometry,
        cargo_profile
      );
      client.release();

      // Generate optimization suggestions based on preferences
      const optimizationSuggestions = {
        current_route_assessment: {
          feasibility: analysis.route_summary.route_feasibility,
          compliance_score: analysis.route_summary.overall_compliance_score,
          critical_issues: analysis.critical_issues.mandatory_compliance_actions.length
        },
        
        recommended_modifications: generateRouteOptimizations(analysis, optimization_preferences),
        
        alternative_strategies: {
          equipment_modifications: analysis.recommendations.equipment_adjustments,
          legal_preparations: analysis.recommendations.legal_preparations,
          transport_alternatives: analysis.recommendations.alternative_transport
        },
        
        avoidance_recommendations: analysis.avoidance_zones?.restricted_jurisdictions.map(rj => ({
          jurisdiction: rj.name,
          postal_code: rj.postal_code,
          reasons: rj.reasons,
          suggested_action: 'Route around this jurisdiction if possible'
        })) || []
      };

      return reply.send(optimizationSuggestions);
    } catch (error) {
      fastify.log.error({ error }, 'Error generating route optimization');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // System health and capabilities
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const client = await fastify.pg.connect();
      
      // Check all subsystem health
      const healthChecks = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM regulations'),
        client.query('SELECT COUNT(*) as count FROM interstate_reciprocity'),
        client.query('SELECT COUNT(*) as count FROM nfa_regulations'),
        client.query('SELECT COUNT(*) as count FROM local_ordinances'),
        client.query('SELECT COUNT(*) as count FROM jurisdictions WHERE type = \'state\'')
      ]);

      client.release();

      return reply.send({
        status: 'healthy',
        capabilities: {
          comprehensive_analysis: true,
          multi_system_integration: true,
          unified_alerting: true,
          route_optimization: true,
          compliance_scoring: true
        },
        subsystem_data: {
          state_regulations: parseInt(healthChecks[0].rows[0].count),
          reciprocity_records: parseInt(healthChecks[1].rows[0].count),
          nfa_regulations: parseInt(healthChecks[2].rows[0].count),
          local_ordinances: parseInt(healthChecks[3].rows[0].count),
          jurisdictions: parseInt(healthChecks[4].rows[0].count)
        },
        api_version: '1.0',
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error in advanced compliance health check');
      return reply.status(500).send({
        status: 'unhealthy',
        error: 'Internal server error'
      });
    }
  });
}

// Helper functions
function calculateSystemScore(alerts: any[]): number {
  if (alerts.length === 0) return 100;
  
  const criticalPenalty = alerts.filter(a => a.severity === 'critical').length * 15;
  const warningPenalty = alerts.filter(a => a.severity === 'warning').length * 8;
  const infoPenalty = alerts.filter(a => a.severity === 'info').length * 3;
  
  return Math.max(0, 100 - criticalPenalty - warningPenalty - infoPenalty);
}

function extractRiskFactors(alerts: any[]): string[] {
  const riskFactors: string[] = [];
  
  if (alerts.some(a => a.message.toLowerCase().includes('prohibited'))) {
    riskFactors.push('Prohibited items detected');
  }
  
  if (alerts.some(a => a.alert_source === 'reciprocity' && a.severity === 'critical')) {
    riskFactors.push('Permit recognition failures');
  }
  
  if (alerts.some(a => a.alert_source === 'nfa_regulation' && a.severity === 'critical')) {
    riskFactors.push('NFA item restrictions');
  }
  
  if (alerts.some(a => a.alert_source === 'local_ordinance' && a.severity === 'warning')) {
    riskFactors.push('Local ordinance conflicts');
  }
  
  return riskFactors;
}

function generateRouteOptimizations(analysis: any, preferences: any): string[] {
  const suggestions: string[] = [];
  
  if (preferences.avoid_prohibited_items && analysis.critical_issues.prohibited_items.length > 0) {
    suggestions.push('Remove or replace prohibited items before travel');
  }
  
  if (preferences.minimize_permit_issues && analysis.alerts_by_system.reciprocity_analysis) {
    const nonRecognition = analysis.alerts_by_system.reciprocity_analysis.recognition_summary.not_recognized;
    if (nonRecognition.length > 0) {
      suggestions.push(`Consider alternate route avoiding: ${nonRecognition.join(', ')}`);
    }
  }
  
  if (preferences.prefer_permissive_states) {
    suggestions.push('Route through constitutional carry states when possible');
  }
  
  if (preferences.avoid_major_cities && analysis.alerts_by_system.local_ordinances.summary.active_ordinances > 0) {
    suggestions.push('Plan route to bypass major metropolitan areas');
  }
  
  return suggestions;
}
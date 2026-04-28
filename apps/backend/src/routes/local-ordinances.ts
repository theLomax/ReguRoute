/**
 * Local Ordinances API Routes
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  getLocalOrdinancesByState,
  getLocalOrdinancesForJurisdiction,
  searchLocalOrdinancesByType,
  getLocalOrdinancesSummary,
  analyzeLocalOrdinanceRoute,
  updateLocalOrdinance
} from '../services/local-ordinances.js';

interface StateParams {
  state: string;
}

interface JurisdictionParams {
  jurisdiction: string;
}

interface OrdinanceTypeParams {
  type: string;
}

interface RouteAnalysisBody {
  route_geometry: GeoJSON.LineString;
  cargo_profile?: any;
}

export async function localOrdinancesRoutes(fastify: FastifyInstance) {
  // Get all local ordinances for a specific state
  fastify.get<{
    Params: StateParams;
  }>('/state/:state', async (request: FastifyRequest<{
    Params: StateParams;
  }>, reply: FastifyReply) => {
    const { state } = request.params;

    try {
      const client = await fastify.pg.connect();
      const ordinances = await getLocalOrdinancesByState(client, state);
      client.release();

      const jurisdictionCount = new Set(ordinances.map(o => o.jurisdiction_id)).size;
      const cityCount = ordinances.filter(o => o.jurisdiction_type === 'city').length;
      const countyCount = ordinances.filter(o => o.jurisdiction_type === 'county').length;

      return reply.send({
        state: state.toUpperCase(),
        total_ordinances: ordinances.length,
        jurisdictions_with_ordinances: jurisdictionCount,
        city_ordinances: cityCount,
        county_ordinances: countyCount,
        ordinances
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error getting state local ordinances');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Get local ordinances for a specific city or county
  fastify.get<{
    Params: JurisdictionParams;
    Querystring: { type?: 'city' | 'county' };
  }>('/jurisdiction/:jurisdiction', async (request: FastifyRequest<{
    Params: JurisdictionParams;
    Querystring: { type?: 'city' | 'county' };
  }>, reply: FastifyReply) => {
    const { jurisdiction } = request.params;
    const { type = 'city' } = request.query;

    try {
      const client = await fastify.pg.connect();
      const ordinances = await getLocalOrdinancesForJurisdiction(client, jurisdiction, type);
      client.release();

      if (ordinances.length === 0) {
        return reply.status(404).send({
          error: `No ordinances found for ${type} named "${jurisdiction}"`
        });
      }

      return reply.send({
        jurisdiction: ordinances[0].jurisdiction_name,
        type: ordinances[0].jurisdiction_type,
        state: ordinances[0].parent_state,
        ordinance_count: ordinances.length,
        ordinances
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error getting jurisdiction ordinances');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Search ordinances by type across all jurisdictions
  fastify.get<{
    Params: OrdinanceTypeParams;
  }>('/type/:type', async (request: FastifyRequest<{
    Params: OrdinanceTypeParams;
  }>, reply: FastifyReply) => {
    const { type } = request.params;

    const validTypes = [
      'concealed_carry', 'open_carry', 'vehicle_carry', 'public_buildings',
      'parks_recreation', 'assault_weapons', 'magazine_capacity', 'storage_requirements',
      'discharge_prohibition', 'dealer_licensing', 'waiting_period', 'registration',
      'permit_requirements', 'transport_restrictions', 'other'
    ];

    if (!validTypes.includes(type)) {
      return reply.status(400).send({
        error: 'Invalid ordinance type',
        valid_types: validTypes
      });
    }

    try {
      const client = await fastify.pg.connect();
      const ordinances = await searchLocalOrdinancesByType(client, type);
      client.release();

      // Group by state for summary
      const byState: Record<string, number> = {};
      ordinances.forEach(ord => {
        byState[ord.parent_state] = (byState[ord.parent_state] || 0) + 1;
      });

      return reply.send({
        ordinance_type: type,
        total_ordinances: ordinances.length,
        jurisdictions_affected: new Set(ordinances.map(o => o.jurisdiction_id)).size,
        by_state: byState,
        ordinances
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error searching ordinances by type');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Analyze local ordinance compliance for a route
  fastify.post<{
    Body: RouteAnalysisBody;
  }>('/analyze', async (request: FastifyRequest<{
    Body: RouteAnalysisBody;
  }>, reply: FastifyReply) => {
    const { route_geometry, cargo_profile } = request.body;

    if (!route_geometry || route_geometry.type !== 'LineString') {
      return reply.status(400).send({
        error: 'Valid route_geometry (GeoJSON LineString) is required'
      });
    }

    try {
      const client = await fastify.pg.connect();
      const analysis = await analyzeLocalOrdinanceRoute(client, route_geometry, cargo_profile);
      client.release();

      return reply.send(analysis);
    } catch (error) {
      fastify.log.error({ error }, 'Error analyzing route local ordinances');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Get summary of all local ordinances in the system
  fastify.get('/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const client = await fastify.pg.connect();
      const summary = await getLocalOrdinancesSummary(client);
      client.release();

      return reply.send(summary);
    } catch (error) {
      fastify.log.error({ error }, 'Error getting local ordinances summary');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Health check for local ordinances system
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const client = await fastify.pg.connect();
      
      // Check total ordinances
      const totalResult = await client.query(`
        SELECT COUNT(*) as total FROM local_ordinances
      `);

      // Check jurisdictions with ordinances
      const jurisdictionsResult = await client.query(`
        SELECT COUNT(DISTINCT jurisdiction_id) as total FROM local_ordinances
      `);

      // Check states represented
      const statesResult = await client.query(`
        SELECT COUNT(DISTINCT parent.postal_code) as total
        FROM local_ordinances lo
        JOIN jurisdictions j ON lo.jurisdiction_id = j.id
        JOIN jurisdictions parent ON j.parent_id = parent.id
        WHERE parent.type = 'state'
      `);

      // Check recent verifications
      const recentResult = await client.query(`
        SELECT COUNT(*) as total FROM local_ordinances
        WHERE last_verified >= (CURRENT_DATE - INTERVAL '1 year')
      `);

      client.release();

      const total = parseInt(totalResult.rows[0].total);
      const recent = parseInt(recentResult.rows[0].total);

      return reply.send({
        status: 'healthy',
        data: {
          total_ordinances: total,
          jurisdictions_with_ordinances: parseInt(jurisdictionsResult.rows[0].total),
          states_represented: parseInt(statesResult.rows[0].total),
          recent_verifications: recent,
          verification_freshness_pct: total > 0 ? Math.round((recent / total) * 100) : 0
        }
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error checking local ordinances health');
      return reply.status(500).send({
        status: 'unhealthy',
        error: 'Internal server error'
      });
    }
  });

  // Get preemption analysis - shows which ordinances are likely preempted
  fastify.get('/preemption-analysis', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const client = await fastify.pg.connect();

      const result = await client.query(`
        SELECT 
          j.name as jurisdiction,
          j.type as jurisdiction_type,
          parent.postal_code as state,
          lo.ordinance_type,
          lo.state_preemption_status,
          lo.ordinance_number,
          lo.effective_date,
          lo.notes
        FROM local_ordinances lo
        JOIN jurisdictions j ON lo.jurisdiction_id = j.id
        LEFT JOIN jurisdictions parent ON j.parent_id = parent.id
        ORDER BY 
          lo.state_preemption_status,
          parent.postal_code,
          j.name,
          lo.ordinance_type
      `);

      const preemptionSummary = result.rows.reduce((acc: Record<string, number>, row) => {
        const status = row.state_preemption_status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const groupedByStatus = result.rows.reduce((acc: Record<string, any[]>, row) => {
        const status = row.state_preemption_status || 'unknown';
        if (!acc[status]) acc[status] = [];
        acc[status].push(row);
        return acc;
      }, {});

      client.release();

      return reply.send({
        preemption_summary: preemptionSummary,
        ordinances_by_status: groupedByStatus,
        total_ordinances: result.rows.length
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error getting preemption analysis');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });
}
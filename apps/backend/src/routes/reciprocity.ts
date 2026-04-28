/**
 * Interstate Reciprocity API Routes
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  analyzeRouteReciprocity,
  checkReciprocity,
  getPermitTypesForState,
  getReciprocityMap,
  updateReciprocity,
  getStaleReciprocityRecords
} from '../services/reciprocity.js';

interface ReciprocityCheckQuery {
  issuing_state: string;
  recognizing_state: string;
}

interface RouteAnalysisQuery {
  permit_holder_state: string;
  travel_states: string; // comma-separated
  permit_class?: string;
}

interface PermitTypesQuery {
  state: string;
}

interface ReciprocityMapQuery {
  state: string;
}

interface UpdateReciprocityBody {
  issuing_state: string;
  recognizing_state: string;
  recognition_type: 'full' | 'partial' | 'resident_only' | 'none';
  permit_types?: Record<string, any>;
  restrictions?: Record<string, any>;
  notes?: string;
  effective_date?: string;
}

export async function reciprocityRoutes(fastify: FastifyInstance) {
  // Check reciprocity between two specific states
  fastify.get<{
    Querystring: ReciprocityCheckQuery;
  }>('/check', async (request: FastifyRequest<{
    Querystring: ReciprocityCheckQuery;
  }>, reply: FastifyReply) => {
    const { issuing_state, recognizing_state } = request.query;

    if (!issuing_state || !recognizing_state) {
      return reply.status(400).send({
        error: 'Both issuing_state and recognizing_state are required'
      });
    }

    try {
      const client = await fastify.pg.connect();
      const result = await checkReciprocity(client, issuing_state.toUpperCase(), recognizing_state.toUpperCase());
      client.release();

      if (!result) {
        return reply.status(404).send({
          message: `No reciprocity data found between ${issuing_state} and ${recognizing_state}`
        });
      }

      return reply.send(result);
    } catch (error) {
      fastify.log.error({ error }, 'Error checking reciprocity');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Analyze reciprocity for a travel route
  fastify.get<{
    Querystring: RouteAnalysisQuery;
  }>('/analyze', async (request: FastifyRequest<{
    Querystring: RouteAnalysisQuery;
  }>, reply: FastifyReply) => {
    const { permit_holder_state, travel_states, permit_class } = request.query;

    if (!permit_holder_state || !travel_states) {
      return reply.status(400).send({
        error: 'Both permit_holder_state and travel_states are required'
      });
    }

    try {
      const travelStatesArray = travel_states.split(',').map(s => s.trim().toUpperCase());
      
      const client = await fastify.pg.connect();
      const analysis = await analyzeRouteReciprocity(
        client,
        permit_holder_state.toUpperCase(),
        travelStatesArray,
        permit_class || 'standard'
      );
      client.release();

      return reply.send(analysis);
    } catch (error) {
      fastify.log.error({ error }, 'Error analyzing route reciprocity');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Get permit types for a specific state
  fastify.get<{
    Querystring: PermitTypesQuery;
  }>('/permits', async (request: FastifyRequest<{
    Querystring: PermitTypesQuery;
  }>, reply: FastifyReply) => {
    const { state } = request.query;

    if (!state) {
      return reply.status(400).send({
        error: 'State parameter is required'
      });
    }

    try {
      const client = await fastify.pg.connect();
      const permits = await getPermitTypesForState(client, state.toUpperCase());
      client.release();

      return reply.send({
        state: state.toUpperCase(),
        permit_types: permits
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error getting permit types');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Get reciprocity map for a specific state's permits
  fastify.get<{
    Querystring: ReciprocityMapQuery;
  }>('/map', async (request: FastifyRequest<{
    Querystring: ReciprocityMapQuery;
  }>, reply: FastifyReply) => {
    const { state } = request.query;

    if (!state) {
      return reply.status(400).send({
        error: 'State parameter is required'
      });
    }

    try {
      const client = await fastify.pg.connect();
      const reciprocityMap = await getReciprocityMap(client, state.toUpperCase());
      client.release();

      return reply.send({
        issuing_state: state.toUpperCase(),
        reciprocity_map: reciprocityMap
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error getting reciprocity map');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Update reciprocity relationship (POST)
  fastify.post<{
    Body: UpdateReciprocityBody;
  }>('/update', async (request: FastifyRequest<{
    Body: UpdateReciprocityBody;
  }>, reply: FastifyReply) => {
    const {
      issuing_state,
      recognizing_state,
      recognition_type,
      permit_types,
      restrictions,
      notes,
      effective_date
    } = request.body;

    if (!issuing_state || !recognizing_state || !recognition_type) {
      return reply.status(400).send({
        error: 'issuing_state, recognizing_state, and recognition_type are required'
      });
    }

    try {
      const client = await fastify.pg.connect();
      await updateReciprocity(
        client,
        issuing_state.toUpperCase(),
        recognizing_state.toUpperCase(),
        recognition_type,
        permit_types || {},
        restrictions || null,
        notes || null,
        effective_date || null
      );
      client.release();

      return reply.send({
        message: 'Reciprocity updated successfully',
        issuing_state: issuing_state.toUpperCase(),
        recognizing_state: recognizing_state.toUpperCase(),
        recognition_type
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error updating reciprocity');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Get stale reciprocity records that need verification
  fastify.get('/stale', async (request: FastifyRequest, reply: FastifyReply) => {
    const thresholdDays = 365; // Default to 1 year

    try {
      const client = await fastify.pg.connect();
      const staleRecords = await getStaleReciprocityRecords(client, thresholdDays);
      client.release();

      return reply.send({
        threshold_days: thresholdDays,
        stale_records_count: staleRecords.length,
        stale_records: staleRecords
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error getting stale reciprocity records');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Health check for reciprocity data
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const client = await fastify.pg.connect();
      
      // Check total reciprocity records
      const totalResult = await client.query(`
        SELECT COUNT(*) as total FROM interstate_reciprocity
      `);
      const total = parseInt(totalResult.rows[0].total);

      // Check permit types
      const permitsResult = await client.query(`
        SELECT COUNT(*) as total FROM permit_types WHERE active = true
      `);
      const permits = parseInt(permitsResult.rows[0].total);

      // Check recent verifications
      const recentResult = await client.query(`
        SELECT COUNT(*) as total FROM interstate_reciprocity
        WHERE last_verified >= (CURRENT_DATE - INTERVAL '6 months')
      `);
      const recent = parseInt(recentResult.rows[0].total);

      client.release();

      return reply.send({
        status: 'healthy',
        data: {
          total_reciprocity_records: total,
          active_permit_types: permits,
          recent_verifications: recent,
          verification_freshness_pct: total > 0 ? Math.round((recent / total) * 100) : 0
        }
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error checking reciprocity health');
      return reply.status(500).send({
        status: 'unhealthy',
        error: 'Internal server error'
      });
    }
  });
}
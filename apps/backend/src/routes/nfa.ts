/**
 * NFA Item API Routes
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  getUserNfaItems,
  addNfaItem,
  updateNfaItem,
  deleteNfaItem,
  analyzeNfaRoute,
  getNfaRegulationsForState,
  updateNfaRegulation,
  type NfaItem
} from '../services/nfa.js';

interface UserIdParams {
  userId: string;
}

interface ItemIdParams {
  itemId: string;
}

interface StateParams {
  state: string;
}

interface AddNfaItemBody {
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
}

interface UpdateNfaItemBody extends Partial<AddNfaItemBody> {
  active?: boolean;
}

interface RouteAnalysisQuery {
  user_id: string;
  states: string; // comma-separated state codes
}

export async function nfaRoutes(fastify: FastifyInstance) {
  // Get all NFA items for a user
  fastify.get<{
    Params: UserIdParams;
  }>('/users/:userId/items', async (request: FastifyRequest<{
    Params: UserIdParams;
  }>, reply: FastifyReply) => {
    const { userId } = request.params;

    try {
      const client = await fastify.pg.connect();
      const items = await getUserNfaItems(client, userId);
      client.release();

      return reply.send({
        user_id: userId,
        items_count: items.length,
        items
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error getting NFA items');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Add a new NFA item for a user
  fastify.post<{
    Params: UserIdParams;
    Body: AddNfaItemBody;
  }>('/users/:userId/items', async (request: FastifyRequest<{
    Params: UserIdParams;
    Body: AddNfaItemBody;
  }>, reply: FastifyReply) => {
    const { userId } = request.params;
    const itemData = request.body;

    if (!itemData.item_type) {
      return reply.status(400).send({
        error: 'item_type is required'
      });
    }

    try {
      const client = await fastify.pg.connect();
      const itemId = await addNfaItem(client, {
        user_id: userId,
        active: true,
        ...itemData
      });
      client.release();

      return reply.status(201).send({
        message: 'NFA item added successfully',
        item_id: itemId,
        user_id: userId
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error adding NFA item');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Update an existing NFA item
  fastify.put<{
    Params: UserIdParams & ItemIdParams;
    Body: UpdateNfaItemBody;
  }>('/users/:userId/items/:itemId', async (request: FastifyRequest<{
    Params: UserIdParams & ItemIdParams;
    Body: UpdateNfaItemBody;
  }>, reply: FastifyReply) => {
    const { userId, itemId } = request.params;
    const updates = request.body;

    try {
      const client = await fastify.pg.connect();
      const updated = await updateNfaItem(client, itemId, userId, updates);
      client.release();

      if (!updated) {
        return reply.status(404).send({
          error: 'NFA item not found or not owned by user'
        });
      }

      return reply.send({
        message: 'NFA item updated successfully',
        item_id: itemId,
        user_id: userId
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error updating NFA item');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Delete (deactivate) an NFA item
  fastify.delete<{
    Params: UserIdParams & ItemIdParams;
  }>('/users/:userId/items/:itemId', async (request: FastifyRequest<{
    Params: UserIdParams & ItemIdParams;
  }>, reply: FastifyReply) => {
    const { userId, itemId } = request.params;

    try {
      const client = await fastify.pg.connect();
      const deleted = await deleteNfaItem(client, itemId, userId);
      client.release();

      if (!deleted) {
        return reply.status(404).send({
          error: 'NFA item not found or not owned by user'
        });
      }

      return reply.send({
        message: 'NFA item deleted successfully',
        item_id: itemId,
        user_id: userId
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error deleting NFA item');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Analyze NFA compliance for a route
  fastify.get<{
    Querystring: RouteAnalysisQuery;
  }>('/analyze', async (request: FastifyRequest<{
    Querystring: RouteAnalysisQuery;
  }>, reply: FastifyReply) => {
    const { user_id, states } = request.query;

    if (!user_id || !states) {
      return reply.status(400).send({
        error: 'user_id and states parameters are required'
      });
    }

    try {
      const stateList = states.split(',').map(s => s.trim().toUpperCase());
      
      // Get jurisdiction IDs for the states
      const client = await fastify.pg.connect();
      const jurisdictionResult = await client.query(
        `SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = ANY($1)`,
        [stateList]
      );
      
      if (jurisdictionResult.rows.length === 0) {
        client.release();
        return reply.status(400).send({
          error: 'No valid states found'
        });
      }

      const jurisdictionIds = jurisdictionResult.rows.map(row => row.id);
      const analysis = await analyzeNfaRoute(client, user_id, jurisdictionIds);
      client.release();

      return reply.send(analysis);
    } catch (error) {
      fastify.log.error({ error }, 'Error analyzing NFA route');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Get NFA regulations for a specific state
  fastify.get<{
    Params: StateParams;
  }>('/regulations/:state', async (request: FastifyRequest<{
    Params: StateParams;
  }>, reply: FastifyReply) => {
    const { state } = request.params;

    try {
      const client = await fastify.pg.connect();
      const regulations = await getNfaRegulationsForState(client, state);
      client.release();

      return reply.send({
        state: state.toUpperCase(),
        regulations_count: regulations.length,
        regulations
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error getting NFA regulations');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Get summary of NFA regulations across all states
  fastify.get('/regulations/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const client = await fastify.pg.connect();
      
      const summaryResult = await client.query(`
        SELECT 
          nr.nfa_item_type,
          COUNT(CASE WHEN nr.is_prohibited = true THEN 1 END) as prohibited_states,
          COUNT(CASE WHEN nr.possession_restricted = true AND nr.is_prohibited = false THEN 1 END) as restricted_states,
          COUNT(CASE WHEN nr.is_prohibited = false AND nr.possession_restricted = false THEN 1 END) as permissive_states,
          COUNT(*) as total_regulations
        FROM nfa_regulations nr
        GROUP BY nr.nfa_item_type
        ORDER BY nr.nfa_item_type
      `);

      const totalStatesResult = await client.query(`
        SELECT COUNT(DISTINCT j.id) as total_states
        FROM jurisdictions j
        WHERE j.type = 'state'
      `);
      
      client.release();

      return reply.send({
        total_states: parseInt(totalStatesResult.rows[0].total_states),
        item_type_summary: summaryResult.rows
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error getting NFA regulations summary');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Health check for NFA system
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const client = await fastify.pg.connect();
      
      // Check total NFA items
      const itemsResult = await client.query(`
        SELECT COUNT(*) as total FROM nfa_items WHERE active = true
      `);

      // Check NFA regulations
      const regulationsResult = await client.query(`
        SELECT COUNT(*) as total FROM nfa_regulations
      `);

      // Check states with regulations
      const statesResult = await client.query(`
        SELECT COUNT(DISTINCT jurisdiction_id) as total FROM nfa_regulations
      `);

      client.release();

      return reply.send({
        status: 'healthy',
        data: {
          total_nfa_items: parseInt(itemsResult.rows[0].total),
          total_nfa_regulations: parseInt(regulationsResult.rows[0].total),
          states_with_regulations: parseInt(statesResult.rows[0].total)
        }
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error checking NFA health');
      return reply.status(500).send({
        status: 'unhealthy',
        error: 'Internal server error'
      });
    }
  });
}
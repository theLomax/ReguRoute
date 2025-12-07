import { FastifyInstance } from 'fastify';

interface RouteComplianceRequest {
	origin_state: string;
	destination_state: string;
	transit_states?: string[];
	equipment_item_ids: string[];
}

interface ComplianceResponse {
	compliance_results: any[];
	overall_status: string;
	has_violations: boolean;
	summary: string;
	debug: {
		equipment_count: number;
		restricted_states: string[];
	};
}

export async function routeComplianceRoutes(fastify: FastifyInstance) {
	fastify.addHook('onRequest', fastify.authenticate);

	fastify.post<{ Body: RouteComplianceRequest }>(
		'/',
		{
			schema: {
				body: {
					type: 'object',
					required: ['origin_state', 'destination_state', 'equipment_item_ids'],
					properties: {
						origin_state: { type: 'string' },
						destination_state: { type: 'string' },
						transit_states: { type: 'array', items: { type: 'string' } },
						equipment_item_ids: { type: 'array', items: { type: 'string' } },
					},
				},
			},
		},
		async (request, reply) => {
			const { origin_state, destination_state, transit_states = [], equipment_item_ids } = request.body;

			if (equipment_item_ids.length === 0) {
				return {
					compliance_results: [],
					overall_status: 'compliant',
					has_violations: false,
					summary: 'No equipment selected',
					debug: { equipment_count: 0, restricted_states: [] },
				};
			}

			const client = await fastify.pg.connect();
			try {
				const equipmentResult = await client.query(
					`SELECT id, name, category, platform, features, ammunition_capacity, accepts_detachable_magazine, nfa_subtype, calibers
						FROM equipment_items
						WHERE id = ANY($1) AND user_id = $2`,
					[equipment_item_ids, request.user.id]
				);

				const equipmentItems = equipmentResult.rows;
				const allStates = [origin_state, ...transit_states, destination_state];
				const restrictedStates = allStates.filter(
					(state) => state.toUpperCase() === 'NY'
				);

				const response: ComplianceResponse = {
					compliance_results: equipmentItems.map((item: any) => ({
						equipment_id: item.id,
						equipment_name: item.name,
						category: item.category,
						violations: [],
						warnings: [],
					})),
					overall_status: restrictedStates.length > 0 ? 'needs_review' : 'compliant',
					has_violations: restrictedStates.length > 0,
					summary:
						restrictedStates.length > 0
							? `Route passes through ${restrictedStates.length} state(s) with restrictions: ${restrictedStates.join(', ')}`
							: 'No restricted states on route',
					debug: {
						equipment_count: equipmentItems.length,
						restricted_states: restrictedStates,
					},
				};

				return response;
			} finally {
				client.release();
			}
		}
	);
}

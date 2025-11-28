import { FastifyInstance } from 'fastify';

// Equipment item categories
type EquipmentItemCategory = 'handgun' | 'rifle' | 'shotgun' | 'nfa_item' | 'magazine' | 'other';
type FirearmPlatform = 'handgun' | 'rifle' | 'shotgun';
type NFASubtype = 'suppressor' | 'sbr' | 'sbs' | 'aow' | 'machine_gun' | 'destructive_device';

interface CreateEquipmentItemBody {
	name: string;
	category: EquipmentItemCategory;
	accepts_detachable_magazine?: boolean;
	calibers?: string[];
	platform?: FirearmPlatform;
	ammunition_capacity?: number;
	nfa_subtype?: NFASubtype;
	features?: string[];
	barrel_length_inches?: number;
	overall_length_inches?: number;
	notes?: string;
}

interface UpdateEquipmentItemBody {
	name?: string;
	category?: EquipmentItemCategory;
	accepts_detachable_magazine?: boolean;
	calibers?: string[];
	platform?: FirearmPlatform;
	ammunition_capacity?: number;
	nfa_subtype?: NFASubtype;
	features?: string[];
	barrel_length_inches?: number;
	overall_length_inches?: number;
	notes?: string;
}

interface ItemParams {
	id: string;
}

const categoryEnum = ['handgun', 'rifle', 'shotgun', 'nfa_item', 'magazine', 'other'];
const platformEnum = ['handgun', 'rifle', 'shotgun'];
const nfaSubtypeEnum = ['suppressor', 'sbr', 'sbs', 'aow', 'machine_gun', 'destructive_device'];

export async function equipmentItemsRoutes(fastify: FastifyInstance) {
	// All routes require authentication
	fastify.addHook('onRequest', fastify.authenticate);

	// GET /equipment-items - List all user's equipment items
	fastify.get('/', async (request) => {
		const client = await fastify.pg.connect();
		try {
			const result = await client.query(
				`SELECT id, name, category, accepts_detachable_magazine, calibers,
				        platform, ammunition_capacity, nfa_subtype, features,
				        barrel_length_inches, overall_length_inches,
				        notes, created_at, updated_at
				 FROM equipment_items
				 WHERE user_id = $1
				 ORDER BY category, name ASC`,
				[request.user.id]
			);

			return { items: result.rows };
		} finally {
			client.release();
		}
	});

	// GET /equipment-items/:id - Get a specific equipment item
	fastify.get<{ Params: ItemParams }>(
		'/:id',
		{
			schema: {
				params: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'string', format: 'uuid' },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;

			const client = await fastify.pg.connect();
			try {
				const result = await client.query(
					`SELECT id, name, category, accepts_detachable_magazine, calibers,
					        platform, ammunition_capacity, nfa_subtype, features,
					        barrel_length_inches, overall_length_inches,
					        notes, created_at, updated_at
					 FROM equipment_items
					 WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'Equipment item not found' });
				}

				return { item: result.rows[0] };
			} finally {
				client.release();
			}
		}
	);

	// POST /equipment-items - Create a new equipment item
	fastify.post<{ Body: CreateEquipmentItemBody }>(
		'/',
		{
			schema: {
				body: {
					type: 'object',
					required: ['name', 'category'],
					properties: {
						name: { type: 'string', minLength: 1, maxLength: 255 },
						category: { type: 'string', enum: categoryEnum },
						accepts_detachable_magazine: { type: 'boolean', default: false },
						calibers: { type: ['array', 'null'], items: { type: 'string' } },
						platform: { type: ['string', 'null'] },
						ammunition_capacity: { type: ['number', 'null'], minimum: 1, maximum: 999 },
						nfa_subtype: { type: ['string', 'null'] },
						features: { type: ['array', 'null'], items: { type: 'string' } },
						barrel_length_inches: { type: ['number', 'null'], minimum: 0 },
						overall_length_inches: { type: ['number', 'null'], minimum: 0 },
						notes: { type: ['string', 'null'] },
					},
				},
			},
		},
		async (request, reply) => {
			const {
				name,
				category,
				accepts_detachable_magazine,
				calibers,
				platform,
				ammunition_capacity,
				nfa_subtype,
				features,
				barrel_length_inches,
				overall_length_inches,
				notes,
			} = request.body;

			const client = await fastify.pg.connect();
			try {
				const result = await client.query(
					`INSERT INTO equipment_items (
						user_id, name, category, accepts_detachable_magazine, calibers,
						platform, ammunition_capacity, nfa_subtype, features,
						barrel_length_inches, overall_length_inches, notes
					)
					 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
					 RETURNING *`,
					[
						request.user.id,
						name,
						category,
						accepts_detachable_magazine || false,
						calibers && calibers.length > 0 ? calibers : null,
						platform || null,
						ammunition_capacity || null,
						nfa_subtype || null,
						features && features.length > 0 ? features : null,
						barrel_length_inches || null,
						overall_length_inches || null,
						notes || null,
					]
				);

				return reply.code(201).send({ item: result.rows[0] });
			} catch (error) {
				if ((error as { code?: string }).code === '23505') {
					return reply.code(409).send({ error: 'An equipment item with this name already exists' });
				}
				throw error;
			} finally {
				client.release();
			}
		}
	);

	// PUT /equipment-items/:id - Update an equipment item
	fastify.put<{ Params: ItemParams; Body: UpdateEquipmentItemBody }>(
		'/:id',
		{
			schema: {
				params: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'string', format: 'uuid' },
					},
				},
				body: {
					type: 'object',
					properties: {
						name: { type: 'string', minLength: 1, maxLength: 255 },
						category: { type: 'string', enum: categoryEnum },
						accepts_detachable_magazine: { type: ['boolean', 'null'] },
						calibers: { type: ['array', 'null'], items: { type: 'string' } },
						platform: { type: ['string', 'null'] },
						ammunition_capacity: { type: ['number', 'null'], minimum: 1, maximum: 999 },
						nfa_subtype: { type: ['string', 'null'] },
						features: { type: ['array', 'null'], items: { type: 'string' } },
						barrel_length_inches: { type: ['number', 'null'], minimum: 0 },
						overall_length_inches: { type: ['number', 'null'], minimum: 0 },
						notes: { type: ['string', 'null'] },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const updates = request.body;

			const client = await fastify.pg.connect();
			try {
				// Verify ownership
				const existing = await client.query(
					`SELECT id FROM equipment_items WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (existing.rows.length === 0) {
					return reply.code(404).send({ error: 'Equipment item not found' });
				}

				// Build dynamic update query
				const setClauses: string[] = ['updated_at = current_timestamp'];
				const values: unknown[] = [];
				let paramIndex = 1;

				const fields = [
					'name',
					'category',
					'accepts_detachable_magazine',
					'calibers',
					'platform',
					'ammunition_capacity',
					'nfa_subtype',
					'features',
					'barrel_length_inches',
					'overall_length_inches',
					'notes',
				] as const;

				for (const field of fields) {
					if (updates[field] !== undefined) {
						setClauses.push(`${field} = $${paramIndex++}`);
						values.push(updates[field]);
					}
				}

				values.push(id, request.user.id);

				const result = await client.query(
					`UPDATE equipment_items SET ${setClauses.join(', ')}
					 WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
					 RETURNING *`,
					values
				);

				return { item: result.rows[0] };
			} catch (error) {
				if ((error as { code?: string }).code === '23505') {
					return reply.code(409).send({ error: 'An equipment item with this name already exists' });
				}
				throw error;
			} finally {
				client.release();
			}
		}
	);

	// DELETE /equipment-items/:id - Delete an equipment item
	fastify.delete<{ Params: ItemParams }>(
		'/:id',
		{
			schema: {
				params: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'string', format: 'uuid' },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;

			const client = await fastify.pg.connect();
			try {
				const result = await client.query(
					`DELETE FROM equipment_items WHERE id = $1 AND user_id = $2 RETURNING id`,
					[id, request.user.id]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'Equipment item not found' });
				}

				return { success: true, id };
			} finally {
				client.release();
			}
		}
	);
}

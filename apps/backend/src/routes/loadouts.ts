import { FastifyInstance } from 'fastify';

interface CreateLoadoutBody {
	name: string;
	description?: string;
	is_default?: boolean;
	item_ids?: string[];
}

interface UpdateLoadoutBody {
	name?: string;
	description?: string;
	is_default?: boolean;
}

interface LoadoutParams {
	id: string;
}

interface AddItemBody {
	equipment_item_id: string;
	quantity?: number;
}

interface RemoveItemParams {
	id: string;
	itemId: string;
}

export async function loadoutsRoutes(fastify: FastifyInstance) {
	// All routes require authentication
	fastify.addHook('onRequest', fastify.authenticate);

	// GET /loadouts - List all user's loadouts with items
	fastify.get('/', async (request) => {
		const client = await fastify.pg.connect();
		try {
			// Get loadouts
			const loadoutsResult = await client.query(
				`SELECT id, name, description, is_default, created_at, updated_at
				 FROM loadouts
				 WHERE user_id = $1
				 ORDER BY is_default DESC, name ASC`,
				[request.user.id]
			);

			// Get items for all loadouts
			const loadoutIds = loadoutsResult.rows.map((l) => l.id);
			let itemsMap: Map<string, unknown[]> = new Map();

			if (loadoutIds.length > 0) {
				const itemsResult = await client.query(
					`SELECT li.loadout_id, li.equipment_item_id, li.quantity,
					        ei.id, ei.name, ei.category, ei.accepts_detachable_magazine,
					        ei.calibers, ei.platform, ei.ammunition_capacity, ei.nfa_subtype,
					        ei.barrel_length_inches, ei.overall_length_inches,
					        ei.notes, ei.created_at, ei.updated_at
					 FROM loadout_items li
					 JOIN equipment_items ei ON li.equipment_item_id = ei.id
					 WHERE li.loadout_id = ANY($1)
					 ORDER BY ei.category, ei.name`,
					[loadoutIds]
				);

				// Group items by loadout_id
				for (const row of itemsResult.rows) {
					const items = itemsMap.get(row.loadout_id) || [];
					items.push({
						equipment_item_id: row.equipment_item_id,
						quantity: row.quantity,
						equipment_item: {
							id: row.id,
							name: row.name,
							category: row.category,
							accepts_detachable_magazine: row.accepts_detachable_magazine,
							calibers: row.calibers,
							platform: row.platform,
							ammunition_capacity: row.ammunition_capacity,
							nfa_subtype: row.nfa_subtype,
							barrel_length_inches: row.barrel_length_inches,
							overall_length_inches: row.overall_length_inches,
							notes: row.notes,
							created_at: row.created_at,
							updated_at: row.updated_at,
						},
					});
					itemsMap.set(row.loadout_id, items);
				}
			}

			// Combine loadouts with their items
			const loadouts = loadoutsResult.rows.map((loadout) => ({
				...loadout,
				items: itemsMap.get(loadout.id) || [],
			}));

			return { loadouts };
		} finally {
			client.release();
		}
	});

	// GET /loadouts/:id - Get a specific loadout with items
	fastify.get<{ Params: LoadoutParams }>(
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
				const loadoutResult = await client.query(
					`SELECT id, name, description, is_default, created_at, updated_at
					 FROM loadouts
					 WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (loadoutResult.rows.length === 0) {
					return reply.code(404).send({ error: 'Loadout not found' });
				}

				const itemsResult = await client.query(
					`SELECT li.equipment_item_id, li.quantity,
					        ei.id, ei.name, ei.category, ei.accepts_detachable_magazine,
					        ei.calibers, ei.platform, ei.ammunition_capacity, ei.nfa_subtype,
					        ei.barrel_length_inches, ei.overall_length_inches,
					        ei.notes, ei.created_at, ei.updated_at
					 FROM loadout_items li
					 JOIN equipment_items ei ON li.equipment_item_id = ei.id
					 WHERE li.loadout_id = $1
					 ORDER BY ei.category, ei.name`,
					[id]
				);

				const items = itemsResult.rows.map((row) => ({
					equipment_item_id: row.equipment_item_id,
					quantity: row.quantity,
					equipment_item: {
						id: row.id,
						name: row.name,
						category: row.category,
						accepts_detachable_magazine: row.accepts_detachable_magazine,
						calibers: row.calibers,
						platform: row.platform,
						ammunition_capacity: row.ammunition_capacity,
						nfa_subtype: row.nfa_subtype,
						barrel_length_inches: row.barrel_length_inches,
						overall_length_inches: row.overall_length_inches,
						notes: row.notes,
						created_at: row.created_at,
						updated_at: row.updated_at,
					},
				}));

				return {
					loadout: {
						...loadoutResult.rows[0],
						items,
					},
				};
			} finally {
				client.release();
			}
		}
	);

	// GET /loadouts/default - Get user's default loadout
	fastify.get('/default', async (request) => {
		const client = await fastify.pg.connect();
		try {
			const loadoutResult = await client.query(
				`SELECT id, name, description, is_default, created_at, updated_at
				 FROM loadouts
				 WHERE user_id = $1 AND is_default = true`,
				[request.user.id]
			);

			if (loadoutResult.rows.length === 0) {
				return { loadout: null };
			}

			const itemsResult = await client.query(
				`SELECT li.equipment_item_id, li.quantity,
				        ei.id, ei.name, ei.category, ei.accepts_detachable_magazine,
				        ei.platform, ei.ammunition_capacity, ei.calibers,
				        ei.barrel_length_inches, ei.overall_length_inches,
				        ei.nfa_subtype, ei.notes, ei.created_at, ei.updated_at
				 FROM loadout_items li
				 JOIN equipment_items ei ON li.equipment_item_id = ei.id
				 WHERE li.loadout_id = $1
				 ORDER BY ei.category, ei.name`,
				[loadoutResult.rows[0].id]
			);

			const items = itemsResult.rows.map((row) => ({
				equipment_item_id: row.equipment_item_id,
				quantity: row.quantity,
				equipment_item: {
					id: row.id,
					name: row.name,
					item_type: row.category,
					accepts_detachable_magazine: row.accepts_detachable_magazine,
					platform: row.platform,
					ammunition_capacity: row.ammunition_capacity,
					calibers: row.calibers,
					barrel_length_inches: row.barrel_length_inches,
					overall_length_inches: row.overall_length_inches,
					nfa_subtype: row.nfa_subtype,
					notes: row.notes,
					created_at: row.created_at,
					updated_at: row.updated_at,
				},
			}));

			return {
				loadout: {
					...loadoutResult.rows[0],
					items,
				},
			};
		} finally {
			client.release();
		}
	});

	// POST /loadouts - Create a new loadout
	fastify.post<{ Body: CreateLoadoutBody }>(
		'/',
		{
			schema: {
				body: {
					type: 'object',
					required: ['name'],
					properties: {
						name: { type: 'string', minLength: 1, maxLength: 255 },
						description: { type: 'string' },
						is_default: { type: 'boolean', default: false },
						item_ids: {
							type: 'array',
							items: { type: 'string', format: 'uuid' },
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { name, description, is_default, item_ids } = request.body;

			const client = await fastify.pg.connect();
			try {
				await client.query('BEGIN');

				// If setting as default, unset any existing default first
				if (is_default) {
					await client.query(
						`UPDATE loadouts SET is_default = false WHERE user_id = $1 AND is_default = true`,
						[request.user.id]
					);
				}

				// Create loadout
				const loadoutResult = await client.query(
					`INSERT INTO loadouts (user_id, name, description, is_default)
					 VALUES ($1, $2, $3, $4)
					 RETURNING *`,
					[request.user.id, name, description || null, is_default || false]
				);

				const loadout = loadoutResult.rows[0];

				// Add items if provided
				if (item_ids && item_ids.length > 0) {
					// Verify all items belong to user
					const itemsCheck = await client.query(
						`SELECT id FROM equipment_items WHERE id = ANY($1) AND user_id = $2`,
						[item_ids, request.user.id]
					);

					if (itemsCheck.rows.length !== item_ids.length) {
						await client.query('ROLLBACK');
						return reply.code(400).send({ error: 'One or more equipment items not found' });
					}

					// Insert loadout items
					for (const itemId of item_ids) {
						await client.query(
							`INSERT INTO loadout_items (loadout_id, equipment_item_id, quantity)
							 VALUES ($1, $2, 1)`,
							[loadout.id, itemId]
						);
					}
				}

				await client.query('COMMIT');

				// Fetch the complete loadout with items
				const itemsResult = await client.query(
					`SELECT li.equipment_item_id, li.quantity,
					        ei.id, ei.name, ei.category, ei.accepts_detachable_magazine,
					        ei.platform, ei.ammunition_capacity, ei.calibers,
					        ei.barrel_length_inches, ei.overall_length_inches,
					        ei.nfa_subtype, ei.notes,
					        ei.created_at, ei.updated_at
					 FROM loadout_items li
					 JOIN equipment_items ei ON li.equipment_item_id = ei.id
					 WHERE li.loadout_id = $1`,
					[loadout.id]
				);

				const items = itemsResult.rows.map((row) => ({
					equipment_item_id: row.equipment_item_id,
					quantity: row.quantity,
					equipment_item: {
						id: row.id,
						name: row.name,
						item_type: row.category,
						accepts_detachable_magazine: row.accepts_detachable_magazine,
						platform: row.platform,
						ammunition_capacity: row.ammunition_capacity,
						calibers: row.calibers,
						barrel_length_inches: row.barrel_length_inches,
						overall_length_inches: row.overall_length_inches,
						nfa_subtype: row.nfa_subtype,
						notes: row.notes,
						created_at: row.created_at,
						updated_at: row.updated_at,
					},
				}));

				return reply.code(201).send({
					loadout: { ...loadout, items },
				});
			} catch (error) {
				await client.query('ROLLBACK');
				if ((error as { code?: string }).code === '23505') {
					return reply.code(409).send({ error: 'A loadout with this name already exists' });
				}
				throw error;
			} finally {
				client.release();
			}
		}
	);

	// PUT /loadouts/:id - Update a loadout
	fastify.put<{ Params: LoadoutParams; Body: UpdateLoadoutBody }>(
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
						description: { type: 'string' },
						is_default: { type: 'boolean' },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { name, description, is_default } = request.body;

			const client = await fastify.pg.connect();
			try {
				// Verify ownership
				const existing = await client.query(
					`SELECT id FROM loadouts WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (existing.rows.length === 0) {
					return reply.code(404).send({ error: 'Loadout not found' });
				}

				// If setting as default, unset any existing default first
				if (is_default) {
					await client.query(
						`UPDATE loadouts SET is_default = false WHERE user_id = $1 AND is_default = true AND id != $2`,
						[request.user.id, id]
					);
				}

				// Build dynamic update query
				const updates: string[] = ['updated_at = current_timestamp'];
				const values: unknown[] = [];
				let paramIndex = 1;

				if (name !== undefined) {
					updates.push(`name = $${paramIndex++}`);
					values.push(name);
				}
				if (description !== undefined) {
					updates.push(`description = $${paramIndex++}`);
					values.push(description);
				}
				if (is_default !== undefined) {
					updates.push(`is_default = $${paramIndex++}`);
					values.push(is_default);
				}

				values.push(id, request.user.id);

				const result = await client.query(
					`UPDATE loadouts SET ${updates.join(', ')}
					 WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
					 RETURNING *`,
					values
				);

				// Fetch items
				const itemsResult = await client.query(
					`SELECT li.equipment_item_id, li.quantity,
					        ei.id, ei.name, ei.category, ei.accepts_detachable_magazine,
					        ei.platform, ei.ammunition_capacity, ei.calibers,
					        ei.barrel_length_inches, ei.overall_length_inches,
					        ei.nfa_subtype, ei.notes,
					        ei.created_at, ei.updated_at
					 FROM loadout_items li
					 JOIN equipment_items ei ON li.equipment_item_id = ei.id
					 WHERE li.loadout_id = $1`,
					[id]
				);

				const items = itemsResult.rows.map((row) => ({
					equipment_item_id: row.equipment_item_id,
					quantity: row.quantity,
					equipment_item: {
						id: row.id,
						name: row.name,
						item_type: row.category,
						accepts_detachable_magazine: row.accepts_detachable_magazine,
						platform: row.platform,
						ammunition_capacity: row.ammunition_capacity,
						calibers: row.calibers,
						barrel_length_inches: row.barrel_length_inches,
						overall_length_inches: row.overall_length_inches,
						nfa_subtype: row.nfa_subtype,
						notes: row.notes,
						created_at: row.created_at,
						updated_at: row.updated_at,
					},
				}));

				return { loadout: { ...result.rows[0], items } };
			} catch (error) {
				if ((error as { code?: string }).code === '23505') {
					return reply.code(409).send({ error: 'A loadout with this name already exists' });
				}
				throw error;
			} finally {
				client.release();
			}
		}
	);

	// DELETE /loadouts/:id - Delete a loadout
	fastify.delete<{ Params: LoadoutParams }>(
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
					`DELETE FROM loadouts WHERE id = $1 AND user_id = $2 RETURNING id`,
					[id, request.user.id]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'Loadout not found' });
				}

				return { success: true, id };
			} finally {
				client.release();
			}
		}
	);

	// POST /loadouts/:id/items - Add an item to a loadout
	fastify.post<{ Params: LoadoutParams; Body: AddItemBody }>(
		'/:id/items',
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
					required: ['equipment_item_id'],
					properties: {
						equipment_item_id: { type: 'string', format: 'uuid' },
						quantity: { type: 'number', minimum: 1, default: 1 },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { equipment_item_id, quantity } = request.body;

			const client = await fastify.pg.connect();
			try {
				// Verify loadout ownership
				const loadoutCheck = await client.query(
					`SELECT id FROM loadouts WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (loadoutCheck.rows.length === 0) {
					return reply.code(404).send({ error: 'Loadout not found' });
				}

				// Verify item ownership
				const itemCheck = await client.query(
					`SELECT id FROM equipment_items WHERE id = $1 AND user_id = $2`,
					[equipment_item_id, request.user.id]
				);

				if (itemCheck.rows.length === 0) {
					return reply.code(404).send({ error: 'Equipment item not found' });
				}

				// Add item to loadout (or update quantity if exists)
				await client.query(
					`INSERT INTO loadout_items (loadout_id, equipment_item_id, quantity)
					 VALUES ($1, $2, $3)
					 ON CONFLICT (loadout_id, equipment_item_id)
					 DO UPDATE SET quantity = $3`,
					[id, equipment_item_id, quantity || 1]
				);

				// Update loadout timestamp
				await client.query(
					`UPDATE loadouts SET updated_at = current_timestamp WHERE id = $1`,
					[id]
				);

				return { success: true };
			} finally {
				client.release();
			}
		}
	);

	// DELETE /loadouts/:id/items/:itemId - Remove an item from a loadout
	fastify.delete<{ Params: RemoveItemParams }>(
		'/:id/items/:itemId',
		{
			schema: {
				params: {
					type: 'object',
					required: ['id', 'itemId'],
					properties: {
						id: { type: 'string', format: 'uuid' },
						itemId: { type: 'string', format: 'uuid' },
					},
				},
			},
		},
		async (request, reply) => {
			const { id, itemId } = request.params;

			const client = await fastify.pg.connect();
			try {
				// Verify loadout ownership
				const loadoutCheck = await client.query(
					`SELECT id FROM loadouts WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (loadoutCheck.rows.length === 0) {
					return reply.code(404).send({ error: 'Loadout not found' });
				}

				// Remove item from loadout
				const result = await client.query(
					`DELETE FROM loadout_items
					 WHERE loadout_id = $1 AND equipment_item_id = $2
					 RETURNING id`,
					[id, itemId]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'Item not in this loadout' });
				}

				// Update loadout timestamp
				await client.query(
					`UPDATE loadouts SET updated_at = current_timestamp WHERE id = $1`,
					[id]
				);

				return { success: true };
			} finally {
				client.release();
			}
		}
	);
}

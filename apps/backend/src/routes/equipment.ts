import { FastifyInstance } from 'fastify';
import type { CargoProfile } from '../services/regulations.js';

interface CreateEquipmentBody {
	name: string;
	description?: string;
	cargo_profile: CargoProfile;
	is_default?: boolean;
}

interface UpdateEquipmentBody {
	name?: string;
	description?: string;
	cargo_profile?: CargoProfile;
	is_default?: boolean;
}

interface EquipmentParams {
	id: string;
}

const cargoProfileSchema = {
	type: 'object',
	required: ['has_firearms'],
	properties: {
		has_firearms: { type: 'boolean' },
		firearm_types: {
			type: 'array',
			items: { type: 'string', enum: ['handgun', 'rifle', 'shotgun'] },
		},
		has_concealed_carry_permit: { type: 'boolean' },
		permit_states: { type: 'array', items: { type: 'string' } },
		magazine_capacity: { type: 'number' },
		has_assault_weapon: { type: 'boolean' },
	},
};

export async function equipmentRoutes(fastify: FastifyInstance) {
	// All equipment routes require authentication
	fastify.addHook('onRequest', fastify.authenticate);

	// GET /equipment - List all user's equipment presets
	fastify.get('/', async (request, reply) => {
		const client = await fastify.pg.connect();
		try {
			const result = await client.query(
				`SELECT id, name, description, cargo_profile, is_default, created_at, updated_at
				 FROM user_equipment
				 WHERE user_id = $1
				 ORDER BY is_default DESC, name ASC`,
				[request.user.id]
			);

			return { equipment: result.rows };
		} finally {
			client.release();
		}
	});

	// GET /equipment/:id - Get a specific equipment preset
	fastify.get<{ Params: EquipmentParams }>(
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
					`SELECT id, name, description, cargo_profile, is_default, created_at, updated_at
					 FROM user_equipment
					 WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'Equipment preset not found' });
				}

				return { equipment: result.rows[0] };
			} finally {
				client.release();
			}
		}
	);

	// POST /equipment - Create a new equipment preset
	fastify.post<{ Body: CreateEquipmentBody }>(
		'/',
		{
			schema: {
				body: {
					type: 'object',
					required: ['name', 'cargo_profile'],
					properties: {
						name: { type: 'string', minLength: 1, maxLength: 255 },
						description: { type: 'string' },
						cargo_profile: cargoProfileSchema,
						is_default: { type: 'boolean', default: false },
					},
				},
			},
		},
		async (request, reply) => {
			const { name, description, cargo_profile, is_default } = request.body;

			const client = await fastify.pg.connect();
			try {
				// If setting as default, unset any existing default first
				if (is_default) {
					await client.query(
						`UPDATE user_equipment SET is_default = false WHERE user_id = $1 AND is_default = true`,
						[request.user.id]
					);
				}

				const result = await client.query(
					`INSERT INTO user_equipment (user_id, name, description, cargo_profile, is_default)
					 VALUES ($1, $2, $3, $4, $5)
					 RETURNING *`,
					[request.user.id, name, description || null, JSON.stringify(cargo_profile), is_default || false]
				);

				return reply.code(201).send({ equipment: result.rows[0] });
			} catch (error) {
				// Handle unique constraint violation (duplicate name)
				if ((error as { code?: string }).code === '23505') {
					return reply.code(409).send({ error: 'An equipment preset with this name already exists' });
				}
				throw error;
			} finally {
				client.release();
			}
		}
	);

	// PUT /equipment/:id - Update an equipment preset
	fastify.put<{ Params: EquipmentParams; Body: UpdateEquipmentBody }>(
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
						cargo_profile: cargoProfileSchema,
						is_default: { type: 'boolean' },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { name, description, cargo_profile, is_default } = request.body;

			const client = await fastify.pg.connect();
			try {
				// Verify ownership
				const existing = await client.query(
					`SELECT id FROM user_equipment WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (existing.rows.length === 0) {
					return reply.code(404).send({ error: 'Equipment preset not found' });
				}

				// If setting as default, unset any existing default first
				if (is_default) {
					await client.query(
						`UPDATE user_equipment SET is_default = false WHERE user_id = $1 AND is_default = true AND id != $2`,
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
				if (cargo_profile !== undefined) {
					updates.push(`cargo_profile = $${paramIndex++}`);
					values.push(JSON.stringify(cargo_profile));
				}
				if (is_default !== undefined) {
					updates.push(`is_default = $${paramIndex++}`);
					values.push(is_default);
				}

				values.push(id, request.user.id);

				const result = await client.query(
					`UPDATE user_equipment SET ${updates.join(', ')}
					 WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
					 RETURNING *`,
					values
				);

				return { equipment: result.rows[0] };
			} catch (error) {
				if ((error as { code?: string }).code === '23505') {
					return reply.code(409).send({ error: 'An equipment preset with this name already exists' });
				}
				throw error;
			} finally {
				client.release();
			}
		}
	);

	// DELETE /equipment/:id - Delete an equipment preset
	fastify.delete<{ Params: EquipmentParams }>(
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
					`DELETE FROM user_equipment WHERE id = $1 AND user_id = $2 RETURNING id`,
					[id, request.user.id]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'Equipment preset not found' });
				}

				return { success: true, id };
			} finally {
				client.release();
			}
		}
	);

	// GET /equipment/default - Get user's default equipment preset
	fastify.get('/default', async (request, reply) => {
		const client = await fastify.pg.connect();
		try {
			const result = await client.query(
				`SELECT id, name, description, cargo_profile, is_default, created_at, updated_at
				 FROM user_equipment
				 WHERE user_id = $1 AND is_default = true`,
				[request.user.id]
			);

			if (result.rows.length === 0) {
				return { equipment: null };
			}

			return { equipment: result.rows[0] };
		} finally {
			client.release();
		}
	});
}

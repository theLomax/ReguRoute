import { FastifyInstance } from 'fastify';

type PermitType = 'ccw' | 'ltc' | 'chl';

interface CreatePermitBody {
	permit_type: PermitType;
	issuing_state: string;
	issue_date?: string;
	expiration_date?: string;
}

interface UpdatePermitBody {
	permit_type?: PermitType;
	issuing_state?: string;
	issue_date?: string;
	expiration_date?: string;
	is_active?: boolean;
}

interface PermitParams {
	id: string;
}

const permitTypeEnum = ['ccw', 'ltc', 'chl'];

export async function permitsRoutes(fastify: FastifyInstance) {
	// All routes require authentication
	fastify.addHook('onRequest', fastify.authenticate);

	// GET /permits - List all user's permits
	fastify.get('/', async (request) => {
		const client = await fastify.pg.connect();
		try {
			const result = await client.query(
				`SELECT id, permit_type, issuing_state, issue_date, expiration_date,
				        is_active, created_at, updated_at
				 FROM user_permits
				 WHERE user_id = $1
				 ORDER BY issuing_state ASC`,
				[request.user.id]
			);

			return { permits: result.rows };
		} finally {
			client.release();
		}
	});

	// GET /permits/active - Get user's active permits
	fastify.get('/active', async (request) => {
		const client = await fastify.pg.connect();
		try {
			const result = await client.query(
				`SELECT id, permit_type, issuing_state, issue_date, expiration_date,
				        is_active, created_at, updated_at
				 FROM user_permits
				 WHERE user_id = $1 AND is_active = true
				 ORDER BY issuing_state ASC`,
				[request.user.id]
			);

			return { permits: result.rows };
		} finally {
			client.release();
		}
	});

	// GET /permits/:id - Get a specific permit
	fastify.get<{ Params: PermitParams }>(
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
					`SELECT id, permit_type, issuing_state, issue_date, expiration_date,
					        is_active, created_at, updated_at
					 FROM user_permits
					 WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'Permit not found' });
				}

				return { permit: result.rows[0] };
			} finally {
				client.release();
			}
		}
	);

	// POST /permits - Create a new permit
	fastify.post<{ Body: CreatePermitBody }>(
		'/',
		{
			schema: {
				body: {
					type: 'object',
					required: ['permit_type', 'issuing_state'],
					properties: {
						permit_type: { type: 'string', enum: permitTypeEnum },
						issuing_state: { type: 'string', minLength: 2, maxLength: 2 },
						issue_date: { type: 'string', format: 'date' },
						expiration_date: { type: 'string', format: 'date' },
					},
				},
			},
		},
		async (request, reply) => {
			const { permit_type, issuing_state, issue_date, expiration_date } = request.body;

			const client = await fastify.pg.connect();
			try {
				const result = await client.query(
					`INSERT INTO user_permits (user_id, permit_type, issuing_state, issue_date, expiration_date, is_active)
					 VALUES ($1, $2, $3, $4, $5, true)
					 RETURNING *`,
					[
						request.user.id,
						permit_type,
						issuing_state.toUpperCase(),
						issue_date || null,
						expiration_date || null,
					]
				);

				return reply.code(201).send({ permit: result.rows[0] });
			} catch (error) {
				if ((error as { code?: string }).code === '23505') {
					return reply
						.code(409)
						.send({ error: `You already have a ${permit_type.toUpperCase()} permit for ${issuing_state.toUpperCase()}` });
				}
				throw error;
			} finally {
				client.release();
			}
		}
	);

	// PUT /permits/:id - Update a permit
	fastify.put<{ Params: PermitParams; Body: UpdatePermitBody }>(
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
						permit_type: { type: 'string', enum: permitTypeEnum },
						issuing_state: { type: 'string', minLength: 2, maxLength: 2 },
						issue_date: { type: 'string', format: 'date' },
						expiration_date: { type: 'string', format: 'date' },
						is_active: { type: 'boolean' },
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
					`SELECT id FROM user_permits WHERE id = $1 AND user_id = $2`,
					[id, request.user.id]
				);

				if (existing.rows.length === 0) {
					return reply.code(404).send({ error: 'Permit not found' });
				}

				// Build dynamic update query
				const setClauses: string[] = ['updated_at = current_timestamp'];
				const values: unknown[] = [];
				let paramIndex = 1;

				if (updates.permit_type !== undefined) {
					setClauses.push(`permit_type = $${paramIndex++}`);
					values.push(updates.permit_type);
				}
				if (updates.issuing_state !== undefined) {
					setClauses.push(`issuing_state = $${paramIndex++}`);
					values.push(updates.issuing_state.toUpperCase());
				}
				if (updates.issue_date !== undefined) {
					setClauses.push(`issue_date = $${paramIndex++}`);
					values.push(updates.issue_date);
				}
				if (updates.expiration_date !== undefined) {
					setClauses.push(`expiration_date = $${paramIndex++}`);
					values.push(updates.expiration_date);
				}
				if (updates.is_active !== undefined) {
					setClauses.push(`is_active = $${paramIndex++}`);
					values.push(updates.is_active);
				}

				values.push(id, request.user.id);

				const result = await client.query(
					`UPDATE user_permits SET ${setClauses.join(', ')}
					 WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
					 RETURNING *`,
					values
				);

				return { permit: result.rows[0] };
			} catch (error) {
				if ((error as { code?: string }).code === '23505') {
					return reply.code(409).send({ error: 'A permit with this type and state already exists' });
				}
				throw error;
			} finally {
				client.release();
			}
		}
	);

	// DELETE /permits/:id - Delete a permit
	fastify.delete<{ Params: PermitParams }>(
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
					`DELETE FROM user_permits WHERE id = $1 AND user_id = $2 RETURNING id`,
					[id, request.user.id]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'Permit not found' });
				}

				return { success: true, id };
			} finally {
				client.release();
			}
		}
	);
}

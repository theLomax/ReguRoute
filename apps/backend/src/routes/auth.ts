import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

interface RegisterBody {
	email: string;
	password: string;
}

interface LoginBody {
	email: string;
	password: string;
}

export async function authRoutes(fastify: FastifyInstance) {
	// POST /auth/register - Create new user
	fastify.post<{ Body: RegisterBody }>(
		'/register',
		{
			schema: {
				body: {
					type: 'object',
					required: ['email', 'password'],
					properties: {
						email: { type: 'string', format: 'email' },
						password: { type: 'string', minLength: 8 },
					},
				},
			},
		},
		async (request, reply) => {
			const { email, password } = request.body;

			const client = await fastify.pg.connect();
			try {
				// Check if user already exists
				const existingUser = await client.query(
					'SELECT id FROM users WHERE email = $1',
					[email.toLowerCase()]
				);

				if (existingUser.rows.length > 0) {
					return reply.code(409).send({ error: 'Email already registered' });
				}

				// Hash password
				const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

				// Insert new user
				const result = await client.query(
					`INSERT INTO users (email, password_hash)
					 VALUES ($1, $2)
					 RETURNING id, email, created_at`,
					[email.toLowerCase(), passwordHash]
				);

				const user = result.rows[0];

				// Generate JWT token
				const token = fastify.jwt.sign(
					{ id: user.id, email: user.email },
					{ expiresIn: '7d' }
				);

				return reply.code(201).send({
					user: {
						id: user.id,
						email: user.email,
						created_at: user.created_at,
					},
					token,
				});
			} finally {
				client.release();
			}
		}
	);

	// POST /auth/login - Authenticate user
	fastify.post<{ Body: LoginBody }>(
		'/login',
		{
			schema: {
				body: {
					type: 'object',
					required: ['email', 'password'],
					properties: {
						email: { type: 'string', format: 'email' },
						password: { type: 'string' },
					},
				},
			},
		},
		async (request, reply) => {
			const { email, password } = request.body;

			const client = await fastify.pg.connect();
			try {
				// Find user by email
				const result = await client.query(
					'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
					[email.toLowerCase()]
				);

				if (result.rows.length === 0) {
					return reply.code(401).send({ error: 'Invalid email or password' });
				}

				const user = result.rows[0];

				// Verify password
				const validPassword = await bcrypt.compare(password, user.password_hash);
				if (!validPassword) {
					return reply.code(401).send({ error: 'Invalid email or password' });
				}

				// Generate JWT token
				const token = fastify.jwt.sign(
					{ id: user.id, email: user.email },
					{ expiresIn: '7d' }
				);

				return {
					user: {
						id: user.id,
						email: user.email,
						created_at: user.created_at,
					},
					token,
				};
			} finally {
				client.release();
			}
		}
	);

	// GET /auth/me - Get current user (protected)
	fastify.get(
		'/me',
		{
			onRequest: [fastify.authenticate],
		},
		async (request, reply) => {
			const client = await fastify.pg.connect();
			try {
				const result = await client.query(
					'SELECT id, email, created_at, updated_at FROM users WHERE id = $1',
					[request.user.id]
				);

				if (result.rows.length === 0) {
					return reply.code(404).send({ error: 'User not found' });
				}

				return { user: result.rows[0] };
			} finally {
				client.release();
			}
		}
	);
}

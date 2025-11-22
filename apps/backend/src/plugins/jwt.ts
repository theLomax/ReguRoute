import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';

// Extend Fastify types for JWT
declare module 'fastify' {
	interface FastifyInstance {
		authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}
}

declare module '@fastify/jwt' {
	interface FastifyJWT {
		payload: { id: string; email: string };
		user: { id: string; email: string };
	}
}

async function jwtPlugin(fastify: FastifyInstance) {
	const secret = process.env.JWT_SECRET;

	if (!secret) {
		throw new Error('JWT_SECRET environment variable is required');
	}

	await fastify.register(fastifyJwt, {
		secret,
	});

	// Decorator for protected routes
	fastify.decorate(
		'authenticate',
		async function (request: FastifyRequest, reply: FastifyReply) {
			try {
				await request.jwtVerify();
			} catch (err) {
				reply.code(401).send({ error: 'Unauthorized' });
			}
		}
	);
}

export default fp(jwtPlugin, {
	name: 'jwt-plugin',
});

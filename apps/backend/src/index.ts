import Fastify from 'fastify';
import dotenv from 'dotenv';
import postgres from '@fastify/postgres';

const server = Fastify({
    logger: true,
});

// Declare a route
server.get('/', async (request, reply) => {
    return { hello: 'world' };
});

// Health check endpoint
server.get('/health', async (request, reply) => {
    return { status: 'ok' };
});

// Database test endpoint
server.get('/db-test', async (request, reply) => {
    try {
        const client = await server.pg.connect();
        const { rows } = await client.query('SELECT NOW()');
        client.release();
        return { timestamp: rows[0].now };
    } catch (err) {
        server.log.error(err, 'Database connection test failed');
        reply.code(500).send({ error: 'Database connection failed' });
    }
});

// Run the server!
const start = async () => {
    try {
        // Explicitly load environment variables first
        dotenv.config();

        // Register plugins that depend on environment variables
        // This ensures the line above has completed before they are configured.
        await server.register(postgres, {
            connectionString: process.env.DATABASE_URL,
        });

        const port = Number(process.env.PORT) || 3000;
        const host = process.env.HOST || '0.0.0.0';
        await server.listen({ port, host });
    } catch (err) {
        server.log.error(err, 'Failed to start server');
        process.exit(1);
    }
};

// Graceful shutdown logic
const signals = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
    process.on(signal, async () => {
        try {
            server.log.info(`Received ${signal}. Shutting down gracefully...`);
            await server.close();
            process.exit(0);
        } catch (err) {
            server.log.error(err, 'Error during graceful shutdown');
            process.exit(1);
        }
    });
}

start();

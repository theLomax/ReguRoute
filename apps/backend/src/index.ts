import Fastify from 'fastify';

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

// Run the server!
const start = async () => {
    try {
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

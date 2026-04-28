import Fastify from 'fastify';
import dotenv from 'dotenv';
import postgres from '@fastify/postgres';
import jwtPlugin from './plugins/jwt.js';
import { authRoutes } from './routes/auth.js';
import { routesRoutes } from './routes/routes.js';
import { calculateRoutes } from './routes/calculate.js';
import { analyzeRoutes } from './routes/analyze.js';
import { equipmentRoutes } from './routes/equipment.js';
import { equipmentItemsRoutes } from './routes/equipment-items.js';
import { loadoutsRoutes } from './routes/loadouts.js';
import { permitsRoutes } from './routes/permits.js';
import { routeComplianceRoutes } from './routes/route-compliance-simple.js';
import { reciprocityRoutes } from './routes/reciprocity.js';
import { nfaRoutes } from './routes/nfa.js';
import { localOrdinancesRoutes } from './routes/local-ordinances.js';
import { advancedComplianceRoutes } from './routes/advanced-compliance.js';

const server = Fastify({
    logger: true,
});

// Add CORS support for web testing
server.addHook('preHandler', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (request.method === 'OPTIONS') {
        reply.code(200).send();
        return;
    }
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

        // Register JWT authentication plugin
        await server.register(jwtPlugin);

        // Register routes
        await server.register(authRoutes, { prefix: '/auth' });
        await server.register(routesRoutes, { prefix: '/routes' });
        await server.register(calculateRoutes, { prefix: '/calculate' });
        await server.register(analyzeRoutes, { prefix: '/analyze' });
        await server.register(equipmentRoutes, { prefix: '/equipment' }); // Legacy - deprecated
        await server.register(equipmentItemsRoutes, { prefix: '/equipment-items' });
        await server.register(loadoutsRoutes, { prefix: '/loadouts' });
        await server.register(permitsRoutes, { prefix: '/permits' });
        await server.register(routeComplianceRoutes, { prefix: '/route-compliance' });
        await server.register(reciprocityRoutes, { prefix: '/api/reciprocity' });
        await server.register(nfaRoutes, { prefix: '/api/nfa' });
        await server.register(localOrdinancesRoutes, { prefix: '/api/local-ordinances' });
        await server.register(advancedComplianceRoutes, { prefix: '/api/compliance' });

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

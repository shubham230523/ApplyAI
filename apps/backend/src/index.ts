import * as dotenv from 'dotenv';
dotenv.config();

const port = Number(process.env.PORT) || 4000;
console.log(`BOOTING BACKEND ON PORT ${port}...`);

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

const fastify = Fastify({
  logger: true,
});

// Global error handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

async function main() {
  try {
    await fastify.register(cors, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
    });

    await fastify.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    });

    const secret = process.env.SUPABASE_JWT_SECRET;

    await fastify.register(jwt, {
      secret: secret || 'dev-secret-key-123'
    });

    await fastify.register(swagger, {
      openapi: { info: { title: 'ApplyAI API', version: '1.0.0' } },
    });

    await fastify.register(swaggerUi, { routePrefix: '/docs' });

    fastify.addHook('onRequest', async (request, reply) => {
      console.log(`>>> Incoming Request: ${request.method} ${request.url}`);
    });

    console.log('--- Registering Routes ---');
    const { profileRoutes } = await import('./modules/profiles/profile.routes.js');
    const { orchestratorRoutes } = await import('./modules/orchestrator/orchestrator.routes.js');
    const { resumeRoutes } = await import('./modules/resumes/resume.routes.js');
    const { applicationRoutes } = await import('./modules/applications/application.routes.js');
    const { jobsRoutes } = await import('./modules/jobs/jobs.routes.js');

    // Run schema verification
    try {
      const { verifySchema } = await import('./db/index.js');
      await verifySchema();
    } catch (err) {
      console.warn('Schema verification failed, continuing...', err);
    }

    await fastify.register(profileRoutes, { prefix: '/api/profile' });
    await fastify.register(orchestratorRoutes, { prefix: '/api/orchestrator' });
    await fastify.register(resumeRoutes, { prefix: '/api/resume' });
    await fastify.register(applicationRoutes, { prefix: '/api/applications' });
    await fastify.register(jobsRoutes, { prefix: '/api/jobs' });

    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`=========================================`);
    console.log(`ApplyAI Backend active on port: ${port}`);
    console.log(`=========================================`);
  } catch (err) {
    console.error('FATAL ERROR DURING STARTUP:');
    console.error(err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('CRITICAL: main() failed with unhandled error:');
  console.error(err);
  process.exit(1);
});

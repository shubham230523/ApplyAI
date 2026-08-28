import * as dotenv from 'dotenv';
dotenv.config();

const port = Number(process.env.PORT) || 4001;
console.log(`BOOTING BACKEND ON PORT ${port}...`);
if (!process.env.PORT) {
  console.log('NOTE: process.env.PORT is not defined, defaulting to 4001');
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { profileRoutes } from './modules/profiles/profile.routes.js';
import { orchestratorRoutes } from './modules/orchestrator/orchestrator.routes.js';
import { resumeRoutes } from './modules/resumes/resume.routes.js';
import { applicationRoutes } from './modules/applications/application.routes.js';
import { jobsRoutes } from './modules/jobs/jobs.routes.js';

const fastify = Fastify({
  logger: true,
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
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    });

    const secret = process.env.SUPABASE_JWT_SECRET;

    // Register JWT plugin
    // Actual verification is now handled by Supabase SDK in auth.middleware.ts
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

    fastify.get('/health', async () => {
      console.log('HEALTH CHECK HIT');
      return { status: 'ok' };
    });

    await fastify.register(profileRoutes, { prefix: '/api/profile' });
    await fastify.register(orchestratorRoutes, { prefix: '/api/orchestrator' });
    await fastify.register(resumeRoutes, { prefix: '/api/resume' });
    await fastify.register(applicationRoutes, { prefix: '/api/applications' });
    await fastify.register(jobsRoutes, { prefix: '/api/jobs' });

    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    console.error('FATAL ERROR DURING STARTUP:');
    console.error(err);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('!!! Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('!!! Uncaught Exception:', err);
});

main().catch(err => {
  console.error('CRITICAL: main() failed with unhandled error:');
  console.error(err);
  process.exit(1);
});

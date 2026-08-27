import * as dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { profileRoutes } from './modules/profiles/profile.routes';
import { orchestratorRoutes } from './modules/orchestrator/orchestrator.routes';
import { resumeRoutes } from './modules/resumes/resume.routes';
import { applicationRoutes } from './modules/applications/application.routes';
import { jobsRoutes } from './modules/jobs/jobs.routes';

const fastify = Fastify({
  logger: true,
});

async function main() {
  try {
    await fastify.register(cors, { origin: '*' });

    // Minimal JWT registration to support types/decorators
    // We now use Supabase SDK for actual verification in auth.middleware.ts
    await fastify.register(jwt, {
      secret: process.env.SUPABASE_JWT_SECRET || 'dev-secret-key-123'
    });

    await fastify.register(swagger, {
      openapi: { info: { title: 'ApplyAI API', version: '1.0.0' } },
    });

    await fastify.register(swaggerUi, { routePrefix: '/docs' });

    fastify.get('/health', async () => ({ status: 'ok' }));

    await fastify.register(profileRoutes, { prefix: '/api/profile' });
    await fastify.register(orchestratorRoutes, { prefix: '/api/orchestrator' });
    await fastify.register(resumeRoutes, { prefix: '/api/resume' });
    await fastify.register(applicationRoutes, { prefix: '/api/applications' });
    await fastify.register(jobsRoutes, { prefix: '/api/jobs' });

    const port = Number(process.env.PORT) || 4000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    console.error('FATAL ERROR DURING STARTUP:');
    console.error(err);
    process.exit(1);
  }
}

main();

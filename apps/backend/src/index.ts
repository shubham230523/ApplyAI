import * as dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { profileRoutes } from './modules/profiles/profile.routes.js';
import { orchestratorRoutes } from './modules/orchestrator/orchestrator.routes.js';
import { resumeRoutes } from './modules/resumes/resume.routes.js';
import { applicationRoutes } from './modules/applications/application.routes.js';
import { jobsRoutes } from './modules/jobs/jobs.routes.js';

const fastify = Fastify({
  logger: true,
  routerOptions: {
    ignoreTrailingSlash: true,
  }
});

fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

if (process.env.SUPABASE_JWT_SECRET) {
  fastify.register(jwt, { secret: process.env.SUPABASE_JWT_SECRET });
}

fastify.register(swagger, {
  openapi: { info: { title: 'ApplyAI API', version: '1.0.0' } },
});

fastify.register(swaggerUi, { routePrefix: '/docs' });

fastify.get('/health', async () => ({ status: 'ok' }));

fastify.register(profileRoutes, { prefix: '/api/profile' });
fastify.register(orchestratorRoutes, { prefix: '/api/orchestrator' });
fastify.register(resumeRoutes, { prefix: '/api/resume' });
fastify.register(applicationRoutes, { prefix: '/api/applications' });
fastify.register(jobsRoutes, { prefix: '/api/jobs' });

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

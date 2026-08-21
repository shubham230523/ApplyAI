import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import { profileRoutes } from './modules/profiles/profile.routes.js';
import * as dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Plugins
fastify.register(cors, {
  origin: '*', // Adjust for production
});

if (process.env.SUPABASE_JWT_SECRET) {
  fastify.register(jwt, {
    secret: process.env.SUPABASE_JWT_SECRET,
  });
}

fastify.register(swagger, {
  openapi: {
    info: {
      title: 'ApplyAI API',
      description: 'AI-Powered Job Search & Auto-Apply Platform API',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
});

fastify.register(swaggerUi, {
  routePrefix: '/docs',
});

// Health Check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API Routes
fastify.register(profileRoutes, { prefix: '/api/profile' });

// Start Server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

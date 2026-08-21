import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { profileSchema } from './profile.schema.js';
import { getProfile, updateProfile, getOrCreateUser } from './profile.service.js';
import { authenticate } from '../../common/auth.middleware.js';

export async function profileRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Get current user profile',
        tags: ['Profile'],
        response: {
          200: profileSchema.nullable(),
        },
      },
    },
    async (request, reply) => {
      const dbUser = await getOrCreateUser(request.user.email);
      const profile = await getProfile(dbUser.id);
      return profile || null;
    }
  );

  server.patch(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Update current user profile',
        tags: ['Profile'],
        body: profileSchema,
        response: {
          200: profileSchema,
        },
      },
    },
    async (request, reply) => {
      const dbUser = await getOrCreateUser(request.user.email);
      const profile = await updateProfile(dbUser.id, request.body);
      return profile;
    }
  );
}

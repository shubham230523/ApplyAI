import { FastifyInstance } from 'fastify';
import { getProfile, updateProfile, getOrCreateUser } from './profile.service.js';
import { authenticate } from '../../common/auth.middleware.js';

export async function profileRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const dbUser = await getOrCreateUser(request.user.sub, request.user.email);
      const profile = await getProfile(dbUser.id);
      return profile || null;
    }
  );

  fastify.patch(
    '/',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const dbUser = await getOrCreateUser(request.user.sub, request.user.email);
      const profile = await updateProfile(dbUser.id, request.body as any);
      return profile;
    }
  );
}

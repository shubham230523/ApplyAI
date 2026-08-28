import { FastifyInstance } from 'fastify';
import { JobsService } from './jobs.service.js';
import { authenticate } from '../../common/auth.middleware.js';

const jobsService = new JobsService();

export async function jobsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/recruiter',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      // Dynamic import to avoid circular dependencies or startup crashes
      const { getOrCreateRecruiterProfile, getOrCreateUser } = await import('../profiles/profile.service.js');

      const dbUser = await getOrCreateUser(request.user.sub, request.user.email, 'recruiter');
      const recruiter = await getOrCreateRecruiterProfile(dbUser.id, request.user.email);

      if (!recruiter) {
        return reply.status(404).send({ error: 'Recruiter profile not found' });
      }

      const jobs = await jobsService.getJobsByRecruiter(recruiter.id);
      return jobs;
    }
  );

  fastify.post(
    '/',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { getOrCreateRecruiterProfile, getOrCreateUser } = await import('../profiles/profile.service.js');

      const dbUser = await getOrCreateUser(request.user.sub, request.user.email, 'recruiter');
      const recruiter = await getOrCreateRecruiterProfile(dbUser.id, request.user.email);

      if (!recruiter) {
        return reply.status(404).send({ error: 'Recruiter profile not found' });
      }

      const job = await jobsService.createJob(recruiter.id, request.body as any);
      return job;
    }
  );

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await jobsService.getJobById(id);

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    return job;
  });
}

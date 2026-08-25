import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { JobsService } from './jobs.service.js';

const jobsService = new JobsService();

export async function jobsRoutes(fastify: FastifyInstance) {
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // In a real app, this would query the DB by ID
    // For MVP, we'll try to find it in the mocked/synced list or return a generated one
    const job = await jobsService.getJobById(id);

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    return job;
  });
}

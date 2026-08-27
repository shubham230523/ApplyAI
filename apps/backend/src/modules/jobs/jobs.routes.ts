import { FastifyInstance } from 'fastify';
import { JobsService } from './jobs.service.js';

const jobsService = new JobsService();

export async function jobsRoutes(fastify: FastifyInstance) {
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await jobsService.getJobById(id);

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    return job;
  });
}

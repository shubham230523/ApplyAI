import { FastifyInstance } from 'fastify';
import { JobsService } from './jobs.service.js';
import { AIService } from '../ai/ai.service.js';
import { authenticate } from '../../common/auth.middleware.js';
import { getProfile } from '../profiles/profile.service.js';

const jobsService = new JobsService();
const aiService = new AIService();

export async function jobsRoutes(fastify: FastifyInstance) {
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await jobsService.getJobById(id);

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    return job;
  });

  fastify.get('/:id/summary', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await jobsService.getJobById(id);
    if (!job) return reply.status(404).send({ error: 'Job not found' });

    try {
      const summary = await aiService.generateJobSummary(job.description);
      return { summary };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to generate summary' });
    }
  });

  fastify.get('/:id/match', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.sub;

    try {
      const [job, profile] = await Promise.all([
        jobsService.getJobById(id),
        getProfile(userId)
      ]);

      if (!job) return reply.status(404).send({ error: 'Job not found' });
      if (!profile) return reply.status(404).send({ error: 'Profile not found' });

      const result = await aiService.calculateMatchScore(job, profile as any);
      return result;
    } catch (error) {
      console.error('Match score error:', error);
      return reply.status(500).send({ error: 'Failed to calculate match score' });
    }
  });
}

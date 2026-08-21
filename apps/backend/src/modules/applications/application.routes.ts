import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ApplicationService } from './application.service.js';

const applicationService = new ApplicationService();

export async function applicationRoutes(fastify: FastifyInstance) {
  fastify.post('/apply', {
    schema: {
      body: z.object({
        jobId: z.string().uuid(),
      }),
    }
  }, async (request, reply) => {
    const { jobId } = request.body as { jobId: string };
    const userId = (request as any).user?.id || '00000000-0000-0000-0000-000000000000';

    try {
      const application = await applicationService.applyToJob(userId, jobId);
      return application;
    } catch (error: any) {
      console.error('Application error:', error);
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get('/', async (request, reply) => {
    const userId = (request as any).user?.id || '00000000-0000-0000-0000-000000000000';
    return applicationService.getUserApplications(userId);
  });
}

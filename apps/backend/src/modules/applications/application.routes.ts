import { FastifyInstance } from 'fastify';
import { ApplicationService } from './application.service.js';
import { authenticate } from '../../common/auth.middleware.js';

const applicationService = new ApplicationService();

export async function applicationRoutes(fastify: FastifyInstance) {
  fastify.post('/apply', { preHandler: [authenticate] }, async (request, reply) => {
    const { jobId } = request.body as { jobId: string };
    const user = (request as any).user;
    const userId = user.sub;

    try {
      const application = await applicationService.applyToJob(userId, jobId);
      return application;
    } catch (error: any) {
      console.error('Application error:', error);
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const userId = user.sub;
    return applicationService.getUserApplications(userId);
  });

  fastify.get('/ids', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const userId = user.sub;
    const apps = await applicationService.getUserApplications(userId);
    return apps.map((a: any) => a.jobId);
  });

  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    const userId = user.sub;

    const application = await applicationService.getApplicationById(userId, id);
    if (!application) {
      return reply.status(404).send({ error: 'Application not found' });
    }
    return application;
  });
}

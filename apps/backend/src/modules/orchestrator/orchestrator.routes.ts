import { FastifyInstance } from 'fastify';
import { authenticate } from '../../common/auth.middleware.js';

export async function orchestratorRoutes(fastify: FastifyInstance) {
  // Use dynamic imports to prevent circular dependencies or initialization issues at startup
  const { AIService } = await import('../ai/ai.service.js');
  const { JobsService } = await import('../jobs/jobs.service.js');

  const aiService = new AIService();
  const jobsService = new JobsService();

  fastify.post('/query', { preHandler: [authenticate] }, async (request, reply) => {
    const { query, history } = request.body as { query: string, history?: any[] };

    try {
      const response = await aiService.getAggregatedOrchestratorResponse(query, history);

      if (response.jobs && response.jobs.length > 0) {
        JobsService.saveToCache(response.jobs);
      }

      const { db } = await import('../../db/index.js');
      const { userSearches } = await import('../../db/schema.js');

      if ((request as any).user && db) {
        await db.insert(userSearches).values({
          userId: (request as any).user.sub,
          query: query,
          params: response.params,
        });
      }

      return response;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        query,
        params: {},
        jobs: [],
        message: "Neural scout is currently recalibrating. Please try again in a moment."
      });
    }
  });

  fastify.get('/recommendations', { preHandler: [authenticate] }, async (request, reply) => {
    console.error("inside /recommendations");
    try {
      const userId = (request as any).user.sub;
      const recommendations = await jobsService.getRecommendations(userId);
      return { jobs: recommendations };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        jobs: [],
        message: "Unable to retrieve recommendations at this time."
      });
    }
  });
}

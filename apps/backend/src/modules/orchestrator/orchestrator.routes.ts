import { FastifyInstance } from 'fastify';
import { AIService } from '../ai/ai.service';
import { JobsService } from '../jobs/jobs.service';

const aiService = new AIService();

export async function orchestratorRoutes(fastify: FastifyInstance) {
  fastify.post('/query', async (request, reply) => {
    const { query, history } = request.body as { query: string, history?: any[] };

    try {
      const response = await aiService.getAggregatedOrchestratorResponse(query, history);

      if (response.jobs && response.jobs.length > 0) {
        // Safe access to static method
        JobsService.saveToCache(response.jobs);
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
}

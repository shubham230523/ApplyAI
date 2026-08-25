import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AIService } from '../ai/ai.service.js';
import { JobsService } from '../jobs/jobs.service.js';

const aiService = new AIService();

export async function orchestratorRoutes(fastify: FastifyInstance) {
  fastify.post('/query', {
    schema: {
      body: z.object({
        query: z.string(),
        history: z.array(z.any()).optional(),
      }),
    },
  }, async (request, reply) => {
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

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AIService } from '../ai/ai.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { OrchestratorResponse } from '@applyai/shared-types';

const aiService = new AIService();
const jobsService = new JobsService();

export async function orchestratorRoutes(fastify: FastifyInstance) {
  fastify.post('/query', {
    schema: {
      body: z.object({
        query: z.string(),
        history: z.array(z.any()).optional(),
      }),
      response: {
        200: z.object({
          query: z.string(),
          params: z.any(),
          jobs: z.array(z.any()),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply): Promise<OrchestratorResponse> => {
    const { query, history } = request.body as { query: string, history?: any[] };

    // Perform a single aggregated AI call for speed (< 4s target)
    const response = await aiService.getAggregatedOrchestratorResponse(query, history);

    // Cache them for the detail screen
    if (response.jobs && response.jobs.length > 0) {
      JobsService.saveToCache(response.jobs);
    }

    return response;
  });
}

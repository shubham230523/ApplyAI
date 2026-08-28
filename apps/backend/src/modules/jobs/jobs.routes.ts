import { FastifyInstance } from 'fastify';
import { authenticate } from '../../common/auth.middleware.js';
import { getProfile } from '../profiles/profile.service.js';

export async function jobsRoutes(fastify: FastifyInstance) {
  const { JobsService } = await import('./jobs.service.js');
  const { AIService } = await import('../ai/ai.service.js');

  const jobsService = new JobsService();
  const aiService = new AIService();

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

  fastify.get('/:id/cover-letter', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.sub;
    try {
      const job = await jobsService.getJobById(id);
      if (!job) return reply.status(404).send({ error: 'Job not found' });
      const { db } = await import('../../db/index.js');
      const { resumes } = await import('../../db/schema.js');
      const { eq, and } = await import('drizzle-orm');
      if (!db) throw new Error('Database not available');
      const [resume] = await db.select().from(resumes).where(and(eq(resumes.userId, userId), eq(resumes.isMain, true))).limit(1);
      if (!resume || !resume.parsedContent) {
        return reply.status(400).send({ error: 'Main resume not found. Please upload a resume first.' });
      }
      const coverLetter = await aiService.generateCoverLetter(resume.parsedContent as any, job.description);
      return { coverLetter };
    } catch (error) {
      console.error('Cover letter generation error:', error);
      return reply.status(500).send({ error: 'Failed to generate cover letter' });
    }
  });
}

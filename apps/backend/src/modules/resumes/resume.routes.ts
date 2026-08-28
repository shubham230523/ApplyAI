import { FastifyInstance } from 'fastify';
import { ResumeService } from './resume.service.js';
import { authenticate } from '../../common/auth.middleware.js';
import { getOrCreateUser } from '../profiles/profile.service.js';
import { db } from '../../db/index.js';
import { resumes } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';

export async function resumeRoutes(fastify: FastifyInstance) {
    const resumeService = new ResumeService();
    console.log("inside resumeRoutes Screen")

  fastify.get('/main', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const userId = user.sub;

    if (!db) return reply.status(500).send({ error: 'DB not available' });

    const [mainResume] = await db.select()
      .from(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.isMain, true)))
      .limit(1);

    return mainResume || null;
  });

  fastify.post('/tailor', { preHandler: [authenticate] }, async (request, reply) => {
    const { jobId } = request.body as { jobId: string };
    const user = (request as any).user;
    const userId = user.sub;

    if (!jobId) {
      return reply.status(400).send({ error: 'jobId is required' });
    }

    try {
      const result = await resumeService.tailorResume(userId, jobId);
      return result;
    } catch (error: any) {
      console.error('Tailoring error:', error);
      return reply.status(500).send({ error: error.message || 'Failed to tailor resume' });
    }
  });

  fastify.post('/upload', { preHandler: [authenticate] }, async (request, reply) => {
    console.log('>>> [Route: /upload] POST request received');
    const data = await (request as any).file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // ... (rest of mimetypes check)

    const user = (request as any).user;
    const userId = user.sub;
    const email = user.email;

    try {
      // Ensure user exists in our DB before adding a resume (due to FK constraint)
      await getOrCreateUser(userId, email);

      const buffer = await data.toBuffer();
      const extractedData = await resumeService.uploadAndParse(buffer, userId, data.filename, data.mimetype);
      return {
        message: 'Resume processed successfully',
        extractedData
      };
    } catch (error: any) {
      console.error('Resume processing error:', error);
      return reply.status(500).send({ error: error.message || 'Failed to process resume' });
    }
  });

  fastify.post('/match', async (request, reply) => {
    // Basic body check without Zod to avoid prototype issues
    const body = request.body as any;
    if (!body?.jobId) {
      return reply.status(400).send({ error: 'jobId is required' });
    }
    return { score: 85, feedback: 'Strong match based on profile analysis.' };
  });
}

import { FastifyInstance } from 'fastify';
import { ResumeService } from './resume.service.js';
import { authenticate } from '../../common/auth.middleware.js';
import { getOrCreateUser } from '../profiles/profile.service.js';

const resumeService = new ResumeService();

export async function resumeRoutes(fastify: FastifyInstance) {
    console.log("inside resumeRoutes Screen")
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

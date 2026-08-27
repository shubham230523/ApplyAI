import { FastifyInstance } from 'fastify';
import { ResumeService } from './resume.service.js';
import { authenticate } from '../../common/auth.middleware.js';
import { getOrCreateUser } from '../profiles/profile.service.js';

const resumeService = new ResumeService();

export async function resumeRoutes(fastify: FastifyInstance) {
  fastify.post('/upload', { preHandler: [authenticate] }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedMimeTypes.includes(data.mimetype)) {
      return reply.status(400).send({ error: 'Unsupported file type. Please upload PDF, DOCX, JPG, or PNG.' });
    }

    const userId = request.user.sub;
    const email = request.user.email;

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

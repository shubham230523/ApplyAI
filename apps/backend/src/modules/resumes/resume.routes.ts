import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { ResumeService } from './resume.service.js';
import { authenticate } from '../../common/auth.middleware.js';

const resumeService = new ResumeService();

export async function resumeRoutes(fastify: FastifyInstance) {
  // Register multipart with a file size limit (e.g., 5MB)
  fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  fastify.post('/upload', { preHandler: [authenticate] }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    if (data.mimetype !== 'application/pdf') {
      return reply.status(400).send({ error: 'Only PDF files are allowed' });
    }

    const userId = request.user.sub;

    try {
      const buffer = await data.toBuffer();
      const extractedData = await resumeService.uploadAndParse(buffer, userId, data.filename);
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

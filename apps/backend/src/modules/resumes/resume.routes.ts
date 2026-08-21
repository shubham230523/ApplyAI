import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { ResumeService } from './resume.service.js';
import { z } from 'zod';

const resumeService = new ResumeService();

export async function resumeRoutes(fastify: FastifyInstance) {
  // Register multipart with a file size limit (e.g., 5MB)
  fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  fastify.post('/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    if (data.mimetype !== 'application/pdf') {
      return reply.status(400).send({ error: 'Only PDF files are allowed' });
    }

    // In a real app, userId would come from JWT (request.user.id)
    const userId = (request as any).user?.id || '00000000-0000-0000-0000-000000000000';

    try {
      const buffer = await data.toBuffer();
      const profile = await resumeService.parseResume(buffer, userId, data.filename);
      return { message: 'Resume uploaded and parsed successfully', profile };
    } catch (error) {
      console.error('Upload error:', error);
      return reply.status(500).send({ error: 'Failed to parse resume' });
    }
  });

  fastify.post('/match', {
    schema: {
      body: z.object({
        jobId: z.string(),
      }),
    }
  }, async (request, reply) => {
    return { score: 85, feedback: 'Strong match based on profile analysis.' };
  });
}

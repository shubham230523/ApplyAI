import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { getProfile, updateProfile, getOrCreateUser } from './profile.service.js';
import { authenticate } from '../../common/auth.middleware.js';
import { supabase } from '../../lib/supabase.js';
import { randomUUID } from 'crypto';

export async function profileRoutes(fastify: FastifyInstance) {
  fastify.register(multipart, {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB for profile pics
    },
  });

  fastify.get(
    '',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const dbUser = await getOrCreateUser(request.user.sub, request.user.email);
      const profile = await getProfile(dbUser.id);
      return profile || null;
    }
  );

  fastify.patch(
    '',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const dbUser = await getOrCreateUser(request.user.sub, request.user.email);
      const profile = await updateProfile(dbUser.id, request.body as any);
      return profile;
    }
  );

  fastify.post(
    '/image',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'No image uploaded' });
      }

      const userId = request.user.sub;
      const fileExt = data.filename.split('.').pop();
      const fileName = `${userId}/${randomUUID()}.${fileExt}`;

      try {
        const buffer = await data.toBuffer();
        const { error: uploadError } = await supabase.storage
          .from('profile_image')
          .upload(fileName, buffer, {
            contentType: data.mimetype,
            upsert: true
          });

        if (uploadError) {
          // Try to create bucket if it doesn't exist
          if ((uploadError as any).code === 'NoSuchBucket' || uploadError.message?.includes('not found')) {
            await supabase.storage.createBucket('profile_image', { public: true });
            const { error: retryError } = await supabase.storage
              .from('profile_image')
              .upload(fileName, buffer, {
                contentType: data.mimetype,
                upsert: true
              });
            if (retryError) throw retryError;
          } else {
            throw uploadError;
          }
        }

        const { data: { publicUrl } } = supabase.storage.from('profile_image').getPublicUrl(fileName);

        // Update profile with new image URL
        const dbUser = await getOrCreateUser(request.user.sub, request.user.email);
        await updateProfile(dbUser.id, { profileImageUrl: publicUrl } as any);

        return { imageUrl: publicUrl };
      } catch (err: any) {
        console.error('Profile image upload error:', err);
        return reply.status(500).send({ error: err.message || 'Failed to upload image' });
      }
    }
  );
}

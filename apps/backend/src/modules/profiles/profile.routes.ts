import { FastifyInstance } from 'fastify';
import { getProfile, updateProfile, getOrCreateUser, getRecruiterProfile, getOrCreateRecruiterProfile, updateRecruiterProfile } from './profile.service.js';
import { authenticate } from '../../common/auth.middleware.js';
import { supabase } from '../../lib/supabase.js';
import { randomUUID } from 'crypto';

export async function profileRoutes(fastify: FastifyInstance) {
  fastify.get(
    '',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const role = request.user.user_metadata?.role || 'candidate';
      console.log(`[ProfileRoute] GET / request from sub: ${request.user.sub}, email: ${request.user.email}, metadata role: ${role}`);
      const dbUser = await getOrCreateUser(request.user.sub, request.user.email, role);
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
      const role = request.user.user_metadata?.role || 'candidate';
      const dbUser = await getOrCreateUser(request.user.sub, request.user.email, role);
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
      try {
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({ error: 'No image uploaded' });
        }

        const userId = request.user.sub;
        console.log(`Uploading profile image for user: ${userId}, file: ${data.filename}`);

        const fileExt = data.filename.split('.').pop() || 'jpg';
        const fileName = `${userId}/${randomUUID()}.${fileExt}`;

        const buffer = await data.toBuffer();
        console.log(`Buffer created, size: ${buffer.length} bytes`);

        // Detect correct mimetype
        let contentType = data.mimetype;
        if (contentType === 'text/plain' || !contentType) {
          if (data.filename.toLowerCase().endsWith('.jpg') || data.filename.toLowerCase().endsWith('.jpeg')) {
            contentType = 'image/jpeg';
          } else if (data.filename.toLowerCase().endsWith('.png')) {
            contentType = 'image/png';
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('profile_image')
          .upload(fileName, buffer, {
            contentType: contentType,
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          // Try to create bucket if it doesn't exist
          if ((uploadError as any).code === 'NoSuchBucket' || uploadError.message?.includes('not found')) {
            console.log('Creating profile_image bucket...');
            await supabase.storage.createBucket('profile_image', { public: true });
            const { error: retryError } = await supabase.storage
              .from('profile_image')
              .upload(fileName, buffer, {
                contentType: data.mimetype,
                upsert: true
              });
            if (retryError) {
              console.error('Retry upload error:', retryError);
              throw retryError;
            }
          } else {
            throw uploadError;
          }
        }

        const { data: { publicUrl } } = supabase.storage.from('profile_image').getPublicUrl(fileName);
        console.log(`Image uploaded successfully: ${publicUrl}`);

        // Update profile with new image URL
        const dbUser = await getOrCreateUser(request.user.sub, request.user.email);
        await updateProfile(dbUser.id, { profileImageUrl: publicUrl } as any);

        return { imageUrl: publicUrl };
      } catch (err: any) {
        console.error('Profile image upload error:', err);
        return reply.status(500).send({
          error: 'Failed to upload image',
          message: err.message
        });
      }
    }
  );

  fastify.get(
    '/recruiter',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const dbUser = await getOrCreateUser(request.user.sub, request.user.email, 'recruiter');
      const profile = await getOrCreateRecruiterProfile(dbUser.id, request.user.email);
      return profile || null;
    }
  );

  fastify.patch(
    '/recruiter',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const dbUser = await getOrCreateUser(request.user.sub, request.user.email, 'recruiter');
      const profile = await updateRecruiterProfile(dbUser.id, request.body as any);
      return profile;
    }
  );
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  console.log(`[AuthMiddleware] Verifying request for: ${request.url}`);
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    // Delegate verification to Supabase Auth API
    // This handles both HS256 and ES256 automatically
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw error || new Error('User not found');
    }

    // Map Supabase user to the format expected by the rest of the app
    (request as any).user = {
      sub: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata as any
    };
  } catch (err: any) {
    console.error(`Authentication failed: ${err.message}`);
    reply.status(401).send({
      error: 'Unauthorized',
      message: err.message
    });
  }
}
/*
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      user_metadata?: {
        role?: string;
      };
    };
    user: {
      sub: string;
      email: string;
      user_metadata?: {
        role?: string;
      };
    };
  }
}
*/

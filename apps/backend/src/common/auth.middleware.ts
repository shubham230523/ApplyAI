import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  // For testing: bypass auth with a valid UUID
  request.user = {
    sub: 'd83c4b7a-9f1e-4b7a-9f1e-d83c4b7a9f1e',
    email: 'test@example.com'
  };
  return;

  /*
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
  */
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
    };
    user: {
      sub: string;
      email: string;
    };
  }
}

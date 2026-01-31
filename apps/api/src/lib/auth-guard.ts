import type { FastifyRequest, FastifyReply } from 'fastify';

export async function authGuard(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired access token',
    });
  }
}

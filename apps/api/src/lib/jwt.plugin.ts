import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import fjwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { env } from './env.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string };
    user: { sub: string; email: string };
  }
}

async function jwtPlugin(fastify: FastifyInstance) {
  await fastify.register(cookie);

  await fastify.register(fjwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: '15m',
    },
  });
}

export default fp(jwtPlugin, { name: 'jwt-plugin' });

import type { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes.js';

export default async function authPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.register(authRoutes, { prefix: '/api/auth' });
}

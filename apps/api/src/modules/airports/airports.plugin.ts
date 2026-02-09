import type { FastifyInstance } from 'fastify';
import airportsRoutes from './airports.routes.js';

export default async function airportsPlugin(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.register(airportsRoutes, { prefix: '/api/airports' });
}

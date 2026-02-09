import type { FastifyInstance } from 'fastify';
import alertsRoutes from './alerts.routes.js';
import pricesRoutes from './prices.routes.js';

export default async function alertsPlugin(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.register(alertsRoutes, { prefix: '/api/alerts' });
  fastify.register(pricesRoutes, { prefix: '/api/alerts' });
}

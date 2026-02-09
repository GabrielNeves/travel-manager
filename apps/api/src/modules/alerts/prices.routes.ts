import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authGuard } from '../../lib/auth-guard.js';
import { priceHistoryQuerySchema } from './prices.schemas.js';
import { getPriceHistory, getDailyLowestPrices } from './prices.service.js';

export default async function pricesRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  // GET /api/alerts/:id/prices
  fastify.get(
    '/:id/prices',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const parsed = priceHistoryQuerySchema.safeParse(request.query);

      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: parsed.error.issues,
        });
      }

      const result = await getPriceHistory(request.user.sub, id, parsed.data);

      if (!result) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Alert not found',
        });
      }

      return reply.code(200).send(result);
    },
  );

  // GET /api/alerts/:id/prices/daily
  fastify.get(
    '/:id/prices/daily',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const result = await getDailyLowestPrices(request.user.sub, id);

      if (!result) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Alert not found',
        });
      }

      return reply.code(200).send(result);
    },
  );
}

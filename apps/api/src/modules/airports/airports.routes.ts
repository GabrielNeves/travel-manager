import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authGuard } from '../../lib/auth-guard.js';
import { searchAirports } from '../../services/amadeus/index.js';

const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
});

export default async function airportsRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  // GET /api/airports/search?q=...
  fastify.get(
    '/search',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = searchQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: parsed.error.issues,
        });
      }

      try {
        const airports = await searchAirports(parsed.data.q);
        return reply.code(200).send(airports);
      } catch (err) {
        request.log.error(err, 'Amadeus airport search failed');
        return reply.code(502).send({
          statusCode: 502,
          error: 'Bad Gateway',
          message: 'Failed to search airports from external provider',
        });
      }
    },
  );
}

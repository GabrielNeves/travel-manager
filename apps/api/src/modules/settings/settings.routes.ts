import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authGuard } from '../../lib/auth-guard.js';
import { updateSettingsSchema } from './settings.schemas.js';
import { getUserSettings, updateUserSettings } from './settings.service.js';

export default async function settingsRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  // GET /api/settings
  fastify.get(
    '/',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const settings = await getUserSettings(request.user.sub);
      return reply.code(200).send(settings);
    },
  );

  // PUT /api/settings
  fastify.put(
    '/',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = updateSettingsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: parsed.error.issues,
        });
      }

      const settings = await updateUserSettings(request.user.sub, parsed.data);
      return reply.code(200).send(settings);
    },
  );
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authGuard } from '../../lib/auth-guard.js';
import {
  createAlertSchema,
  updateAlertSchema,
  listAlertsQuerySchema,
} from './alerts.schemas.js';
import {
  createAlert,
  listAlerts,
  getAlert,
  updateAlert,
  deleteAlert,
  pauseAlert,
  resumeAlert,
} from './alerts.service.js';

export default async function alertsRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  // GET /api/alerts
  fastify.get(
    '/',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listAlertsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: parsed.error.issues,
        });
      }

      const alerts = await listAlerts(request.user.sub, parsed.data.status);
      return reply.code(200).send(alerts);
    },
  );

  // POST /api/alerts
  fastify.post(
    '/',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createAlertSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: parsed.error.issues,
        });
      }

      const alert = await createAlert(request.user.sub, parsed.data);
      return reply.code(201).send(alert);
    },
  );

  // GET /api/alerts/:id
  fastify.get(
    '/:id',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const alert = await getAlert(request.user.sub, id);

      if (!alert) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Alert not found',
        });
      }

      return reply.code(200).send(alert);
    },
  );

  // PUT /api/alerts/:id
  fastify.put(
    '/:id',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const parsed = updateAlertSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: parsed.error.issues,
        });
      }

      const alert = await updateAlert(request.user.sub, id, parsed.data);
      if (!alert) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Alert not found',
        });
      }

      return reply.code(200).send(alert);
    },
  );

  // DELETE /api/alerts/:id
  fastify.delete(
    '/:id',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const result = await deleteAlert(request.user.sub, id);

      if (!result) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Alert not found',
        });
      }

      return reply.code(200).send({ message: 'Alert deleted' });
    },
  );

  // POST /api/alerts/:id/pause
  fastify.post(
    '/:id/pause',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const alert = await pauseAlert(request.user.sub, id);

      if (!alert) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Alert not found or not active',
        });
      }

      return reply.code(200).send(alert);
    },
  );

  // POST /api/alerts/:id/resume
  fastify.post(
    '/:id/resume',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const alert = await resumeAlert(request.user.sub, id);

      if (!alert) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Alert not found or not paused',
        });
      }

      return reply.code(200).send(alert);
    },
  );
}

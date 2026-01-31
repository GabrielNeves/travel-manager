import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from './auth.schemas.js';
import {
  registerUser,
  loginUser,
  handleGoogleCallback,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
} from './auth.service.js';
import { authGuard } from '../../lib/auth-guard.js';
import { env } from '../../lib/env.js';
import { buildGoogleAuthUrl } from './auth.google.js';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

function setRefreshCookie(reply: FastifyReply, refreshToken: string): void {
  reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
}

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/auth/register
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: parsed.error.issues,
      });
    }

    const result = await registerUser(fastify, parsed.data);
    setRefreshCookie(reply, result.tokens.refreshToken);

    return reply.code(201).send({
      accessToken: result.tokens.accessToken,
      user: result.user,
    });
  });

  // POST /api/auth/login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: parsed.error.issues,
      });
    }

    const result = await loginUser(fastify, parsed.data);
    setRefreshCookie(reply, result.tokens.refreshToken);

    return reply.code(200).send({
      accessToken: result.tokens.accessToken,
      user: result.user,
    });
  });

  // GET /api/auth/google
  fastify.get('/google', async (_request: FastifyRequest, reply: FastifyReply) => {
    if (!env.GOOGLE_CLIENT_ID) {
      return reply.code(501).send({
        statusCode: 501,
        error: 'Not Implemented',
        message: 'Google OAuth is not configured',
      });
    }
    const url = buildGoogleAuthUrl();
    return reply.redirect(url);
  });

  // GET /api/auth/google/callback
  fastify.get('/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    const { code } = request.query as { code?: string };

    if (!code) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Authorization code is required',
      });
    }

    const result = await handleGoogleCallback(fastify, code);
    setRefreshCookie(reply, result.tokens.refreshToken);

    // Redirect to frontend with access token
    const frontendUrl = new URL('/auth/callback', env.CORS_ORIGIN);
    frontendUrl.searchParams.set('accessToken', result.tokens.accessToken);
    return reply.redirect(frontendUrl.toString());
  });

  // POST /api/auth/refresh
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[REFRESH_COOKIE_NAME];

    if (!token) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Refresh token not found',
      });
    }

    const tokens = await refreshAccessToken(fastify, token);
    setRefreshCookie(reply, tokens.refreshToken);

    return reply.code(200).send({
      accessToken: tokens.accessToken,
    });
  });

  // POST /api/auth/logout
  fastify.post('/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    return reply.code(200).send({ message: 'Logged out' });
  });

  // GET /api/auth/me (protected)
  fastify.get(
    '/me',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getCurrentUser(request.user.sub);
      return reply.code(200).send(user);
    },
  );

  // PATCH /api/auth/me (protected)
  fastify.patch(
    '/me',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: parsed.error.issues,
        });
      }

      const user = await updateProfile(request.user.sub, parsed.data);
      return reply.code(200).send(user);
    },
  );
}

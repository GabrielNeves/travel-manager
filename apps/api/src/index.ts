import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { prisma } from './lib/prisma.js';
import { env } from './lib/env.js';
import jwtPlugin from './lib/jwt.plugin.js';
import authPlugin from './modules/auth/auth.plugin.js';
import settingsPlugin from './modules/settings/settings.plugin.js';
import alertsPlugin from './modules/alerts/alerts.plugin.js';
import airportsPlugin from './modules/airports/airports.plugin.js';
import { startJobSystem, stopJobSystem } from './jobs/index.js';

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});
await fastify.register(jwtPlugin);
await fastify.register(authPlugin);
await fastify.register(settingsPlugin);
await fastify.register(alertsPlugin);
await fastify.register(airportsPlugin);

fastify.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  } catch {
    return { status: 'ok', database: 'disconnected', timestamp: new Date().toISOString() };
  }
});

fastify.get('/', async () => {
  return { name: 'Travel Manager API', version: '1.0.0' };
});

const start = async () => {
  try {
    const port = parseInt(env.API_PORT, 10);
    const host = env.API_HOST;

    await fastify.listen({ port, host });
    console.log(`Server running at http://${host}:${port}`);

    await startJobSystem();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

const shutdown = async () => {
  await stopJobSystem();
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();

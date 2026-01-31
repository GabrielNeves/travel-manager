import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../lib/env.js';
import { exchangeGoogleCode, getGoogleProfile } from './auth.google.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export function generateTokens(
  fastify: FastifyInstance,
  user: { id: string; email: string },
): TokenPair {
  const payload = { sub: user.id, email: user.email };

  const accessToken = fastify.jwt.sign(payload, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = fastify.jwt.sign(payload, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    key: env.JWT_REFRESH_SECRET,
  });

  return { accessToken, refreshToken };
}

export async function registerUser(
  fastify: FastifyInstance,
  input: RegisterInput,
): Promise<{ tokens: TokenPair; user: AuthUser }> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), {
      statusCode: 409,
    });
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      emailVerified: false,
      accounts: {
        create: {
          provider: 'credentials',
          providerAccountId: input.email,
        },
      },
      settings: {
        create: {},
      },
    },
  });

  const tokens = generateTokens(fastify, { id: user.id, email: user.email });

  return {
    tokens,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    },
  };
}

export async function loginUser(
  fastify: FastifyInstance,
  input: LoginInput,
): Promise<{ tokens: TokenPair; user: AuthUser }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.passwordHash) {
    throw Object.assign(new Error('Invalid email or password'), {
      statusCode: 401,
    });
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordValid) {
    throw Object.assign(new Error('Invalid email or password'), {
      statusCode: 401,
    });
  }

  const tokens = generateTokens(fastify, { id: user.id, email: user.email });

  return {
    tokens,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    },
  };
}

export async function handleGoogleCallback(
  fastify: FastifyInstance,
  code: string,
): Promise<{ tokens: TokenPair; user: AuthUser }> {
  const googleTokens = await exchangeGoogleCode(code);
  const profile = await getGoogleProfile(googleTokens.access_token);

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId: profile.id,
      },
    },
    include: { user: true },
  });

  let user: AuthUser;

  if (existingAccount) {
    // Returning Google user — update OAuth tokens
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        accessToken: googleTokens.access_token,
        refreshToken: googleTokens.refresh_token ?? existingAccount.refreshToken,
        expiresAt: googleTokens.expires_in
          ? Math.floor(Date.now() / 1000) + googleTokens.expires_in
          : null,
      },
    });

    user = {
      id: existingAccount.user.id,
      email: existingAccount.user.email,
      name: existingAccount.user.name,
      emailVerified: existingAccount.user.emailVerified,
    };
  } else {
    // Check if a user with this email already exists (link accounts)
    const existingUser = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingUser) {
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          provider: 'google',
          providerAccountId: profile.id,
          accessToken: googleTokens.access_token,
          refreshToken: googleTokens.refresh_token,
          expiresAt: googleTokens.expires_in
            ? Math.floor(Date.now() / 1000) + googleTokens.expires_in
            : null,
        },
      });

      if (!existingUser.emailVerified) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerified: true },
        });
      }

      user = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        emailVerified: true,
      };
    } else {
      // Brand new Google user
      const newUser = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          emailVerified: true,
          accounts: {
            create: {
              provider: 'google',
              providerAccountId: profile.id,
              accessToken: googleTokens.access_token,
              refreshToken: googleTokens.refresh_token,
              expiresAt: googleTokens.expires_in
                ? Math.floor(Date.now() / 1000) + googleTokens.expires_in
                : null,
            },
          },
          settings: {
            create: {},
          },
        },
      });

      user = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        emailVerified: newUser.emailVerified,
      };
    }
  }

  const tokens = generateTokens(fastify, { id: user.id, email: user.email });
  return { tokens, user };
}

export async function refreshAccessToken(
  fastify: FastifyInstance,
  refreshToken: string,
): Promise<TokenPair> {
  const decoded = fastify.jwt.verify<{ sub: string; email: string }>(
    refreshToken,
    { key: env.JWT_REFRESH_SECRET },
  );

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
  });

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 401 });
  }

  return generateTokens(fastify, { id: user.id, email: user.email });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      language: true,
      country: true,
      timezone: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return user;
}

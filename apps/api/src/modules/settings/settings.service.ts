import { prisma } from '../../lib/prisma.js';
import type { UpdateSettingsInput } from './settings.schemas.js';

export async function getUserSettings(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      notifyInApp: true,
      notifyWhatsApp: true,
      notifyPush: true,
      notifyOnHistoricalLow: true,
      defaultCheckFrequency: true,
    },
  });

  if (!settings) {
    // Create default settings if they don't exist
    return prisma.userSettings.create({
      data: { userId },
      select: {
        notifyInApp: true,
        notifyWhatsApp: true,
        notifyPush: true,
        notifyOnHistoricalLow: true,
        defaultCheckFrequency: true,
      },
    });
  }

  return settings;
}

export async function updateUserSettings(
  userId: string,
  input: UpdateSettingsInput,
) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input },
    select: {
      notifyInApp: true,
      notifyWhatsApp: true,
      notifyPush: true,
      notifyOnHistoricalLow: true,
      defaultCheckFrequency: true,
    },
  });
}

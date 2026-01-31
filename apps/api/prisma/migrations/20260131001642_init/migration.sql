-- CreateEnum
CREATE TYPE "Language" AS ENUM ('PT_BR', 'EN_US');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('ONE_WAY', 'ROUND_TRIP');

-- CreateEnum
CREATE TYPE "DayShift" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- CreateEnum
CREATE TYPE "CheckFrequency" AS ENUM ('HOURS_1', 'HOURS_3', 'HOURS_6', 'HOURS_12', 'HOURS_24');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DELETED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'WHATSAPP', 'PUSH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "phone" TEXT,
    "language" "Language" NOT NULL DEFAULT 'PT_BR',
    "country" TEXT NOT NULL DEFAULT 'BR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" INTEGER,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "notifyWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "notifyPush" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnHistoricalLow" BOOLEAN NOT NULL DEFAULT true,
    "defaultCheckFrequency" "CheckFrequency" NOT NULL DEFAULT 'HOURS_6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departureCity" TEXT NOT NULL,
    "departureAirportCode" TEXT,
    "destinationCity" TEXT NOT NULL,
    "destinationAirportCode" TEXT,
    "tripType" "TripType" NOT NULL,
    "departureDate" DATE NOT NULL,
    "departureDateEnd" DATE,
    "departureDayShift" "DayShift"[],
    "returnDate" DATE,
    "returnDateEnd" DATE,
    "returnDayShift" "DayShift"[],
    "priceThreshold" DECIMAL(10,2) NOT NULL,
    "airlines" TEXT[],
    "maxFlightDuration" INTEGER,
    "checkFrequency" "CheckFrequency" NOT NULL DEFAULT 'HOURS_6',
    "lastCheckedAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3),
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_records" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "stops" INTEGER NOT NULL DEFAULT 0,
    "bookingLink" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "pricePaid" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "bookingReference" TEXT,
    "airline" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "returnDepartureTime" TIMESTAMP(3),
    "returnArrivalTime" TIMESTAMP(3),
    "calendarEventId" TEXT,
    "returnCalendarEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "flight_alerts_userId_status_idx" ON "flight_alerts"("userId", "status");

-- CreateIndex
CREATE INDEX "flight_alerts_nextCheckAt_status_idx" ON "flight_alerts"("nextCheckAt", "status");

-- CreateIndex
CREATE INDEX "price_records_alertId_checkedAt_idx" ON "price_records"("alertId", "checkedAt");

-- CreateIndex
CREATE INDEX "price_records_alertId_price_idx" ON "price_records"("alertId", "price");

-- CreateIndex
CREATE INDEX "notifications_userId_read_sentAt_idx" ON "notifications"("userId", "read", "sentAt");

-- CreateIndex
CREATE INDEX "purchases_userId_createdAt_idx" ON "purchases"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_alerts" ADD CONSTRAINT "flight_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_records" ADD CONSTRAINT "price_records_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "flight_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "flight_alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "flight_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

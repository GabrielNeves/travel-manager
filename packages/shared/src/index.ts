// Shared types and utilities for Travel Manager

export type TripType = 'one-way' | 'round-trip';

export type DayShift = 'morning' | 'afternoon' | 'night';

export type CheckFrequency = '1h' | '3h' | '6h' | '12h' | '24h';

export type NotificationChannel = 'in-app' | 'whatsapp' | 'push';

export type AlertStatus = 'active' | 'paused' | 'deleted';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  language: 'pt-BR' | 'en-US';
  country: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlightAlert {
  id: string;
  userId: string;
  departureCity: string;
  departureAirportCode?: string;
  destinationCity: string;
  destinationAirportCode?: string;
  tripType: TripType;
  departureDate: Date;
  departureDateEnd?: Date;
  departureDayShift: DayShift[];
  returnDate?: Date;
  returnDateEnd?: Date;
  returnDayShift?: DayShift[];
  priceThreshold: number;
  airlines?: string[];
  maxFlightDuration?: number;
  checkFrequency: CheckFrequency;
  status: AlertStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceRecord {
  id: string;
  alertId: string;
  price: number;
  airline: string;
  departureTime: Date;
  arrivalTime: Date;
  duration: number;
  stops: number;
  bookingLink?: string;
  checkedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  alertId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  read: boolean;
  sentAt: Date;
}

// Utility functions
export function formatCurrency(value: number, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: Date, locale = 'pt-BR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

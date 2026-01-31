import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  language: z.enum(['PT_BR', 'EN_US']).optional(),
  country: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  language: string;
  country: string;
  timezone: string;
  emailVerified: boolean;
}

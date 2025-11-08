// Validation utilities
import { z } from 'zod';

// Email 驗證
export const emailSchema = z.string().email('Invalid email address');

// Password 驗證
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be less than 128 characters');

// Username 驗證
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be less than 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores');

// Entry title 驗證
export const entryTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(500, 'Title must be less than 500 characters');

// Task title 驗證
export const taskTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title must be less than 200 characters');

// Priority 驗證
export const prioritySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

// Color 驗證 (hex color)
export const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format. Use hex format (#RRGGBB)');

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const isValidPassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const isValidUsername = (username: string): boolean => {
  return usernameSchema.safeParse(username).success;
};

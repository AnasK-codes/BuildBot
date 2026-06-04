// ============================================================
// BuildBot — AI App Generator
// Environment Configuration with Zod Validation
// ============================================================
// This module validates ALL required environment variables at
// startup. If any variable is missing or malformed, the process
// fails fast with a clear error message — no silent misconfig.
// ============================================================

import { z } from 'zod';

// --- Schema Definition ---

const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string({
      required_error: 'DATABASE_URL is required',
    })
    .url('DATABASE_URL must be a valid URL')
    .startsWith('postgresql://', 'DATABASE_URL must be a PostgreSQL connection string'),

  // JWT
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(16, 'JWT_SECRET must be at least 16 characters for security'),

  JWT_REFRESH_SECRET: z
    .string({ required_error: 'JWT_REFRESH_SECRET is required' })
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters for security'),

  JWT_EXPIRES_IN: z
    .string({ required_error: 'JWT_EXPIRES_IN is required' })
    .default('15m'),

  JWT_REFRESH_EXPIRES_IN: z
    .string({ required_error: 'JWT_REFRESH_EXPIRES_IN is required' })
    .default('7d'),

  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      errorMap: () => ({
        message: 'NODE_ENV must be one of: development, production, test',
      }),
    })
    .default('development'),
});

// --- Validation & Export ---

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('\n╔══════════════════════════════════════════╗');
    console.error('║  ENVIRONMENT CONFIGURATION ERROR         ║');
    console.error('╚══════════════════════════════════════════╝\n');
    console.error(formatted);
    console.error('\nCheck your .env file against .env.example\n');

    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

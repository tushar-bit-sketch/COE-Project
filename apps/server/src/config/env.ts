import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3002),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().default('sentinel-x-ultra-secure-clearance-jwt-key-2026-alpha-7'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  DETECTION_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.35),
  OCCLUSION_TIMEOUT_MS: z.coerce.number().default(3000),
  PREDICTION_TIMEOUT_MS: z.coerce.number().default(5000),
  ANOMALY_THRESHOLD: z.coerce.number().default(2.8),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ FATAL: Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

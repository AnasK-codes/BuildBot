// ============================================================
// BuildBot — Structured Logger (Pino)
// ============================================================
// Pino provides fast, structured JSON logging in production
// and human-readable pretty-printing in development.
// All modules should import `logger` from this file.
// ============================================================

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',

  // Add standard fields to every log line
  base: {
    service: 'buildbot',
    env: process.env.NODE_ENV || 'development',
  },

  // Millisecond timestamps in production for machine parsing,
  // ISO strings in dev for human readability
  timestamp: isProduction
    ? pino.stdTimeFunctions.epochTime
    : pino.stdTimeFunctions.isoTime,

  // Pretty-print in development
  transport: !isProduction && !isTest
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname,service,env',
          messageFormat: '{msg}',
        },
      }
    : undefined,

  // Redact sensitive fields from logs
  redact: {
    paths: ['req.headers.authorization', 'password', 'passwordHash', 'token', 'refreshToken'],
    censor: '[REDACTED]',
  },
});

// Named child loggers for each module
export const createModuleLogger = (moduleName: string) =>
  logger.child({ module: moduleName });

export default logger;

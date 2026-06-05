// ============================================================
// BuildBot — Prisma Client Singleton
// ============================================================
// Next.js hot-reloads in development, which would create a new
// PrismaClient on every reload and exhaust DB connections.
// This module uses the global object to persist a single
// instance across hot reloads, following the official pattern.
// ============================================================

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return globalForPrisma.prisma;
}

if (process.env.NODE_ENV !== 'production') {
  // Eagerly instantiate in dev to persist across reloads
  getPrisma();
}

export default getPrisma;

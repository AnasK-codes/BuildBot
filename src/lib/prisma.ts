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

// Create a proxy so instantiation happens on first use, NOT on module load.
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
    return (globalForPrisma.prisma as any)[prop];
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

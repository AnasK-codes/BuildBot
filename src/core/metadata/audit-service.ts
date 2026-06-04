// ============================================================
// BuildBot — Schema Audit Service
// ============================================================
// Tracks schema evolution history for compliance and rollbacks.
// ============================================================

import prisma from '@/lib/prisma';
import { SchemaEvolutionReport } from '../evolution/evolution.types';

export class SchemaAuditService {
  public async logChange(
    appId: string,
    userId: string,
    fromVersion: number,
    toVersion: number,
    report: SchemaEvolutionReport
  ): Promise<void> {
    await prisma.schemaAuditLog.create({
      data: {
        appId,
        userId,
        fromVersion,
        toVersion,
        impactLevel: report.summary.highestSeverity,
        changeSummary: JSON.stringify({
          safe: report.safeChanges.length,
          warnings: report.warningChanges.length,
          breaking: report.breakingChanges.length,
        }),
        migrationPlan: report.migrationRequirements.length > 0 
          ? JSON.stringify(report.migrationRequirements) as any
          : undefined,
      },
    });
  }
}

export const auditService = new SchemaAuditService();

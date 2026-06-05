// ============================================================
// BuildBot — Prisma Storage Adapter
// ============================================================
// Implements the StorageAdapter interface using Prisma ORM.
// Handles mapping between the domain models and DB records.
// ============================================================

import { getPrisma } from '@/lib/prisma';
import { StorageAdapter } from './storage-adapter';
import { RuntimeContext, RuntimeRecord, QueryOptions } from '@/types/runtime.types';
import { queryBuilder } from '../query-builder';

export class PrismaStorageAdapter implements StorageAdapter {
  async create(context: RuntimeContext, data: Record<string, unknown>): Promise<RuntimeRecord> {
    const appId = context.app.id;
    if (!appId) {
      throw new Error('Cannot create RuntimeRecord: app.id is missing from context');
    }

    const record = await getPrisma().runtimeRecord.create({
      data: {
        appId,
        userId: context.user.userId,
        entitySlug: context.entity.name.toLowerCase(),
        data: data as any,
      },
    });

    return this.mapToRuntimeRecord(record);
  }

  async findOne(context: RuntimeContext, id: string): Promise<RuntimeRecord | null> {
    const record = await getPrisma().runtimeRecord.findFirst({
      where: {
        id,
        appId: context.app.id,
        userId: context.user.userId,
        entitySlug: context.entity.name.toLowerCase(),
        isDeleted: false,
      },
    });

    return record ? this.mapToRuntimeRecord(record) : null;
  }

  async findMany(context: RuntimeContext, options: QueryOptions): Promise<RuntimeRecord[]> {
    const args = queryBuilder.buildPrismaArgs(context, options);
    // Ensure strict scoping again just in case QueryBuilder missed it (defense in depth)
    args.where = {
      ...args.where,
      appId: context.app.id,
      userId: context.user.userId,
      entitySlug: context.entity.name.toLowerCase(),
      isDeleted: false,
    };

    const records = await getPrisma().runtimeRecord.findMany(args);
    return records.map((r: any) => this.mapToRuntimeRecord(r));
  }

  async count(context: RuntimeContext, options: QueryOptions): Promise<number> {
    const args = queryBuilder.buildCountArgs(context, options);
    args.where = {
      ...args.where,
      appId: context.app.id,
      userId: context.user.userId,
      entitySlug: context.entity.name.toLowerCase(),
      isDeleted: false,
    };

    return getPrisma().runtimeRecord.count(args);
  }

  async update(context: RuntimeContext, id: string, data: Record<string, unknown>): Promise<RuntimeRecord> {
    // We do a "find first" then update to ensure ownership constraints are respected
    const existing = await this.findOne(context, id);
    if (!existing) {
      throw new Error('Record not found');
    }

    // Merge for PATCH behavior
    const mergedData = { ...existing.data, ...data };

    const record = await getPrisma().runtimeRecord.update({
      where: { id },
      data: { data: mergedData as any },
    });

    return this.mapToRuntimeRecord(record);
  }

  async replace(context: RuntimeContext, id: string, data: Record<string, unknown>): Promise<RuntimeRecord> {
    const existing = await this.findOne(context, id);
    if (!existing) {
      throw new Error('Record not found');
    }

    // Full replacement for PUT behavior
    const record = await getPrisma().runtimeRecord.update({
      where: { id },
      data: { data: data as any },
    });

    return this.mapToRuntimeRecord(record);
  }

  async delete(context: RuntimeContext, id: string): Promise<boolean> {
    const existing = await this.findOne(context, id);
    if (!existing) {
      return false;
    }

    if (context.entity.softDelete !== false) {
      await getPrisma().runtimeRecord.update({
        where: { id },
        data: { isDeleted: true },
      });
    } else {
      await getPrisma().runtimeRecord.delete({
        where: { id },
      });
    }

    return true;
  }

  private mapToRuntimeRecord(prismaRecord: any): RuntimeRecord {
    return {
      id: prismaRecord.id,
      appId: prismaRecord.appId,
      userId: prismaRecord.userId,
      entitySlug: prismaRecord.entitySlug,
      data: prismaRecord.data as Record<string, unknown>,
      isDeleted: prismaRecord.isDeleted,
      createdAt: prismaRecord.createdAt,
      updatedAt: prismaRecord.updatedAt,
    };
  }
}

export const prismaStorageAdapter = new PrismaStorageAdapter();

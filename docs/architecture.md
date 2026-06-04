# BuildBot Architecture Document

## Overview
BuildBot is a multi-tenant, metadata-driven backend runtime. Instead of writing controllers and migrations for every new business entity, BuildBot dynamically executes CRUD operations against generic storage by interpreting JSON configurations.

## 1. Metadata Engine
- **Purpose:** Ingests, validates, and versions JSON application definitions.
- **Storage:** Relational tables (`AppDefinition`, `EntityDefinition`, `FieldDefinition`).
- **Validation Pipeline:**
  1. JSON parsing (Syntax).
  2. Zod Schema Validation (Structural).
  3. Business Logic Validation (Relations must point to existing entities, no cyclic dependencies, reserved words).

## 2. Runtime Execution Pipeline
- **Dynamic Router:** A single Next.js catch-all route (`/api/apps/[appId]/[entitySlug]/[[...params]]`) handles all data requests.
- **Context Builder:** Authenticates the user and binds the `appId`, `userId`, and `EntityDefinition` to a localized `RuntimeContext` object.
- **Runtime Validator:** Dynamically constructs Zod schemas based on the entity's metadata to validate JSON payloads in real-time.
- **Storage Adapter:** An abstraction layer. Currently implemented via `PrismaStorageAdapter` using PostgreSQL `JSONB`.

## 3. Schema Evolution Engine
- **The Problem:** Modifying an App Definition could break existing JSONB records.
- **The Solution:** 
  - The `SchemaDiffer` utilizes `stableId` fields (e.g. `ent_customer`) to accurately track renames and mutations.
  - The `ImpactAnalyzer` classifies changes (SAFE, WARNING, BREAKING).
  - The `MetadataEngine` refuses breaking changes unless explicitly confirmed. Removed fields are *soft-deleted* (`deprecatedAt`), never hard dropped.
  - The `CompatibilityLayer` massages old JSONB records at read-time to conform to the new schema.

## 4. Security & Hardening
- **Middleware Guard:** IP-based sliding window rate limiter prevents abuse.
- **Payload Limits:** 1MB limit on Schema metadata, 100KB limit on Runtime payload to prevent Node V8 heap overflows.
- **Multi-tenant Isolation:** `userId` and `appId` are hardcoded into the `PrismaStorageAdapter` queries. Cross-tenant reads are mathematically impossible at the database query level.

## 5. Performance Tradeoffs
- **Pros:** Extremely fast scaffolding. Zero database migrations needed to launch new apps. High isolation.
- **Cons:** Indexing JSONB dynamically is challenging in PostgreSQL. Large tables will require GIN indexes on common fields. The Compatibility Layer adds CPU overhead on large list queries.

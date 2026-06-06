# Deletion Plan

## Phase 1: Delete completely isolated files
These files have no inbound dependencies from the core system that we intend to keep.

- Delete `src/types/metadata.types.ts`
- Delete `src/types/runtime.types.ts`
- Delete `src/types/ui-metadata.types.ts`
- Delete `src/core/evolution/evolution.types.ts`
- Delete `src/core/metadata/zod-schemas.ts`
- Delete `src/core/metadata/field-types.ts`

## Phase 2: Delete obsolete services
These services encapsulate business logic for the old CRUD system. We will delete them before deleting the API routes that call them.

- Delete `src/core/metadata/` directory completely (MetadataEngine, SchemaRegistry, etc.)
- Delete `src/core/runtime/` directory completely (CRUD Runtime, QueryBuilder, PrismaAdapter, StorageAdapters, ContextBuilder)
- Delete `src/core/evolution/` directory completely (SchemaDiffer, ImpactAnalyzer, MigrationGenerator)
- Delete `src/core/ui/` directory completely (UI Generator, Renderers, Dynamic Forms/Tables)
- Delete `src/core/validation/stages/schema-validator.ts`, `runtime-validator.ts`, `business-validator.ts`

## Phase 3: Delete obsolete API routes & Pages
Remove all routes that handled metadata or dynamic entity requests.

- Delete `src/app/api/apps/` directory completely (Handles `[appId]/[entity]`, `publish`, `draft`, `seed-status`)
- Delete `src/app/api/ai/` directory (Handles old AI schema generation logic)
- Delete `src/app/apps/` directory (Old frontend pages for CRUD apps)

## Phase 4: Delete obsolete Prisma models
Remove old models from `prisma/schema.prisma` and perform a database migration.

- Remove `AppDefinition`
- Remove `EntityDefinition`
- Remove `FieldDefinition`
- Remove `RuntimeRecord`
- Remove `SchemaAuditLog`
- *Note: Ensure new models `Project`, `GeneratedVersion`, and `GeneratedFile` are added and Prisma client is regenerated.*

## Phase 5: Delete obsolete tests
Remove tests testing the deleted services.

- Delete `tests/phase-b3-draft-runtime.test.ts`
- Delete `tests/phase-b4-sample-data.test.ts`
- Delete `tests/phase-b5-ui-generator.test.ts`
- Delete `tests/phase-b6-frontend-runtime.test.ts`
- Delete `tests/phase-b7-refinement.test.ts`
- Delete `tests/archetypes.test.ts`

## Build Risk Assessment
- **Severity**: Moderate
- **Risk**: High risk of dangling imports in files that bridge the old and new systems.
- **Mitigation**: After each phase, run `tsc --noEmit` to ensure TypeScript compilation succeeds before moving to the next phase. The most critical files to watch out for are `src/app/providers.tsx` and `src/app/page.tsx`.

## Dependency Risk Report
- `src/lib/prisma.ts` exports the Prisma client. All obsolete services use it. Deleting services will not break Prisma, but modifying `schema.prisma` will break any obsolete service not yet deleted. (Thus Phase 4 must happen *after* Phase 2).
- AI Providers (`src/core/ai/providers/*`) are used heavily by the old `ai-service.ts`. They will be retained and plugged into the new `code-generator.ts`.
- The new models (`Project`, `GeneratedVersion`, `GeneratedFile`) do not conflict with the old ones, allowing for a smooth schema transition.

## Estimates
- **Estimated Files Removed**: ~115
- **Estimated LOC Removed**: ~7,500 lines of code

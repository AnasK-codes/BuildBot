# Pivot Cleanup Report

## KEEP AS-IS
The following files and components are essential to the new Lovable-style Website Generator architecture and should be retained without modification:

- `src/core/auth/*` (Authentication, JWT, User Accounts, Reviewer Mode)
- `src/core/ai/providers/*` (AI Providers: OpenAI, Groq, Gemini Support, Provider Factory, Provider Health)
- `src/core/ai/repair-loop.ts` (Repair Loop for AI generated code)
- `src/core/errors/*` (Global error handling and validation)
- `src/config/env.ts` (Environment Validation)
- `src/lib/prisma.ts` (Prisma Infrastructure)
- `src/app/api/auth/*` (Auth API routes)
- `src/app/api/health/*` (Health check)
- `src/app/layout.tsx` & `src/app/globals.css` (Base UI/Styling)

*Reasoning:* These provide the core foundational infrastructure (Auth, Error Handling, DB connections) and the raw AI capabilities required for the new text-to-website generation pipeline.

## REUSE WITH ADAPTATION
The following files need to be refactored to support the new "Project" based model instead of the old "App/CRUD" model:

- `src/core/ai/prompt-builder.ts` ➔ `src/core/ai/web-prompt-builder.ts` (Adapt to generate HTML/CSS/JS instead of metadata)
- `src/core/ai/refinement/refinement-service.ts` (Adapt to refine code output rather than app schemas)
- `src/core/validation/stages/*` (Migrate from runtime/schema validation to HTML/CSS/JS code validation and sanitization)
- `src/app/page.tsx` (Adapt landing page for Website Generator instead of CRUD platform)
- `tests/ai-generation.test.ts` (Adapt to test HTML/CSS/JS generation instead of schema generation)
- `tests/provider-factory.test.ts` (Retain tests for AI provider instantiation)

## REMOVE
The following directories and files are obsolete as they belong to the old Metadata-Driven CRUD architecture:

- `src/core/metadata/*` (MetadataEngine, SchemaRegistry, AppService, SchemaDiffer)
- `src/core/runtime/*` (CRUD Runtime, OperationExecutor, PrismaAdapter, QueryBuilder)
- `src/core/evolution/*` (SchemaEvolution, MigrationGenerator, ImpactAnalyzer)
- `src/core/ui/renderers/*` (DynamicForm, DynamicTable, DashboardWidgets, SidebarRenderer)
- `src/core/ui/ui-generator.ts` (Deterministic UI Generator)
- `src/app/api/apps/[appId]/[entity]/*` (Dynamic Database APIs)
- `src/app/api/apps/[appId]/publish/*` & `draft/*` & `seed-status/*`
- `src/app/apps/*` (Old app-centric routing)
- `src/types/metadata.types.ts`, `src/types/runtime.types.ts`, `src/types/ui-metadata.types.ts`
- `tests/phase-b3-draft-runtime.test.ts`, `tests/phase-b4-sample-data.test.ts`, `tests/phase-b5-ui-generator.test.ts`, `tests/phase-b6-frontend-runtime.test.ts`

*Reasoning:* The pivot fundamentally changes the output from structured metadata/JSON to raw code (HTML/CSS/JS). All metadata resolution, dynamic schema handling, and generic UI rendering engines are no longer required.

## UNKNOWN
- `src/core/ai/archetypes/*` (Might have useful classification logic, but likely obsolete if we use a single web generator prompt. Needs manual review.)
- `src/core/ai/data-seeding-service.ts` (Can it be adapted to seed sample websites? Or completely remove? Needs review.)

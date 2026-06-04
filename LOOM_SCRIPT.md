# Loom Demo Script: BuildBot AI App Generator

**Target Length:** 5–10 Minutes

---

## 1. Project Overview (0:00 - 1:00)
- "Hi, I'm presenting BuildBot, a metadata-driven backend runtime that converts JSON configurations into fully working applications."
- "The goal of this project was to build a system that can generate Database schemas, Validation, and APIs dynamically on the fly, similar to a headless CMS or BaaS like Supabase."

## 2. Architecture (1:00 - 2:00)
- Show the architecture diagram from the README.
- Explain the **Execution Pipeline**: Request -> Auth -> Context Builder -> Schema Registry (Cache) -> Runtime Validator -> Operation Executor -> JSONB Storage.
- Explain why JSONB is used instead of DDL alterations (speed, isolation, multi-tenancy).

## 3. Authentication & Setup (2:00 - 2:30)
- Run `npm run seed:demo` in the terminal to show how easily the environment boots.
- Show Postman/Insomnia: Log in as the demo user to get the JWT.

## 4. Metadata Engine (2:30 - 3:30)
- Show a `POST /api/apps` payload defining a CRM app.
- Explain the **Validation Pipeline** (JSON parsing -> Schema constraints -> Business Logic rules).
- Intentionally send a bad payload (e.g., missing a required stable ID or invalid relation target) to show the `400 Validation Error` response catching it safely.

## 5. Dynamic CRUD (3:30 - 5:00)
- Take the `appId` from the CRM app creation.
- Show `POST /api/apps/{appId}/contact` to create a record.
- Show `GET /api/apps/{appId}/contact`. Explain how the *RuntimeValidator* verified the data against the metadata schema in memory before allowing Prisma to write to JSONB.
- Mention security: "Notice how I didn't pass a userId? The ContextBuilder injects ownership automatically, preventing tenant leakage."

## 6. Schema Evolution (Phase 4) (5:00 - 8:00)
- "The most complex part of this system is Schema Evolution."
- **Scenario:** Update the CRM App Definition. Change a field from `optional` to `required`, and remove a field.
- Explain the internal flow: "The Evolution Engine generates a Diff AST, runs an Impact Analysis, and realizes removing a field is BREAKING."
- Show the API rejecting the request because it lacks `forcePublishBreaking=true`.
- Add the force flag, update successfully.
- Show `GET` on an old record: Explain the **Compatibility Layer** masking the deprecated field at read-time so legacy data doesn't crash the API.

## 7. Audit Logging (8:00 - 8:30)
- Open Prisma Studio or show a DB query on `SchemaAuditLog`.
- Show how the breaking change was logged with the exact diff payload, version bump (v1 -> v2), and impact level.

## 8. Conclusion (8:30 - 9:00)
- Summarize production readiness: Rate limiting middleware, request size limits, cursor pagination, and version-aware caching.
- Conclude the demo.

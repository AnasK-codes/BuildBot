# BuildBot Architecture Document

## Overview
BuildBot is an AI-powered code generation platform that writes, renders, and manages raw web applications (HTML, CSS, Vanilla JS). It completely abstracts away the complexity of traditional framework setup, giving users instantaneous, dependency-free web applications that are rendered directly in the browser.

## 1. The Generation Pipeline
The core of BuildBot is its seamless Generation Pipeline:
1. **Prompt Ingestion:** User describes their desired application in plain text.
2. **Provider Routing:** The `ProviderFactory` selects the optimal AI provider (OpenAI, Groq, or Gemini) based on environment configuration and active fallback strategies.
3. **AI Compilation:** The AI generates the application's structure using strict system prompts designed to yield clean, semantic `index.html`, `style.css`, and `script.js` outputs.
4. **Code Extraction:** The backend parses the AI response, extracting the raw code blocks.
5. **Snapshot Creation:** The code is saved to PostgreSQL via Prisma as a `ProjectVersion`.
6. **Workspace Rendering:** The frontend workspace pulls the latest version and renders it securely within a sandboxed `<iframe>`.

## 2. Iterative Refinement Engine
BuildBot treats applications as living, conversational artifacts:
- **Context Injection:** When a user requests a change via the Chat Panel, the backend packages the user's prompt alongside the *current* code snapshot of the application.
- **Delta Generation:** The AI processes the current state and returns a complete, modified replacement.
- **Immutable Timelines:** Every refinement results in a new `ProjectVersion`. Old code is never overwritten; it is preserved immutably.
- **Rollbacks:** Because versions are immutable, users can seamlessly rollback to any previous version in the timeline.

## 3. Data Model
BuildBot uses Prisma to manage its data layer. The primary entities are:
- **`User`**: The authenticated owner of the projects.
- **`Project`**: The top-level container for an application, storing the initial prompt and metadata.
- **`ProjectVersion`**: A 1-to-many relationship with `Project`. Each version contains `html`, `css`, `js`, the `prompt` that triggered the change, and the `version` number.

## 4. Frontend Workspace UI
The Next.js App Router frontend provides a rich, integrated developer experience:
- **Chat Panel**: A persistent conversational interface tied to the active project.
- **Preview Pane**: A sandboxed `<iframe>` that injects the raw HTML/CSS/JS dynamically, featuring device emulators for responsive testing.
- **File Explorer**: A read-only view of the generated `index.html`, `style.css`, and `script.js` files, featuring syntax-highlighted code blocks.
- **Version Timeline**: A visual history of every prompt and snapshot, providing one-click restoration functionality.

## 5. Security & Isolation
- **Sandboxed Execution:** Generated JS is executed exclusively within the `PreviewPane` iframe, isolating it from the BuildBot parent window context.
- **Tenant Isolation:** Prisma queries strictly enforce `userId` checks on all project and version lookups, ensuring mathematical certainty against cross-tenant data leaks.
- **Rate Limiting:** IP-based sliding window rate limiting prevents abuse of the AI generation endpoints.

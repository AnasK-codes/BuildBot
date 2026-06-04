# BuildBot AI App Generator

BuildBot is a powerful AI-driven application generator that transforms natural language prompts into fully functional, database-backed web applications in seconds. It completely automates schema design, relationship mapping, UI generation, and sample data seeding.

## Overview

Traditional software development requires planning databases, writing boilerplate, and building UIs. BuildBot reduces this to a single step: **Describe what you want**. 

The system leverages OpenAI's advanced models alongside a rigorous deterministic validation pipeline to guarantee that the generated applications are syntactically correct, strictly typed, and immediately usable.

## Features

- **Prompt to App in Seconds**: Describe your CRM, Inventory System, or Project Tracker in plain English.
- **AI Refinement Engine**: Modify existing applications using natural language (e.g., "Add invoices linked to customers").
- **Deterministic Schema Generation**: The AI generates a strict JSON schema which is validated and auto-repaired before execution.
- **Dynamic UI Generation**: Automatically generates React components, tables, and forms based on the inferred schema.
- **Instant Data Seeding**: Automatically generates semantically relevant mock data for your new models.
- **Version History & Diff Viewer**: Track every change, addition, and breaking modification across your app's lifespan.

---

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Components)
- **Database ORM**: [Prisma v7](https://www.prisma.io/)
- **Database Engine**: PostgreSQL
- **AI Integration**: Support for multiple providers ([OpenAI](https://openai.com/), [Groq](https://groq.com/), [Google Gemini](https://deepmind.google/technologies/gemini/)) with automatic fallback strategies.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Data Fetching**: [React Query](https://tanstack.com/query/latest)
- **Validation**: [Zod](https://zod.dev/)

---

## Quick Start (Local Setup)

The following steps will get BuildBot running locally on your machine.

### 1. Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL running locally or remotely (e.g., Neon, Supabase)
- An OpenAI API Key

### 2. Clone and Install
```bash
git clone https://github.com/your-username/BuildBot.git
cd BuildBot
npm install
```

### 3. Configure Environment Variables
Copy the example environment file and fill in your details:
```bash
cp .env.example .env
```
Ensure you provide a valid `DATABASE_URL` and configure your preferred AI provider in the `.env` file (see **Environment Variables** below). By default, BuildBot uses OpenAI.

### 4. Database Setup
Since there are no initial migration files tracked in this repository, you must use `db push` to synchronize the Prisma schema with your database for local development.

```bash
# Generate the Prisma Client
npx prisma generate

# Push the schema to your database
npx prisma db push
```

### 5. Seed Demo Applications
BuildBot comes with three pre-configured demo apps (CRM, Inventory, Project Tracker) to help you get started.

> **Important**: Due to a known issue with Prisma v7 and ES Modules in Node.js, you must explicitly set the engine type when running the seed script via `tsx`.

Run the following command:
```bash
PRISMA_CLIENT_ENGINE_TYPE="library" npm run seed:demo
```
*(Alternatively: `PRISMA_CLIENT_ENGINE_TYPE="library" npx tsx prisma/seed.ts`)*

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Docker Setup

If you prefer to run the application and database in Docker, a `docker-compose.yml` is provided.

### 1. Configure the Environment
Ensure your `.env` file has the `OPENAI_API_KEY` set. The `docker-compose.yml` uses the local `.env` file automatically if it's in the same directory, but you may need to explicitly pass it if you run into missing key errors.

### 2. Start the Containers
```bash
docker-compose up --build
```

### 3. Seed the Database
Once the containers are healthy, open a new terminal and run the seed script *inside* the app container:
```bash
docker exec -it buildbot-app sh -c 'PRISMA_CLIENT_ENGINE_TYPE="library" npx tsx prisma/seed.ts'
```

---

## Reviewer Mode

If you are a reviewer or new developer looking to evaluate the project quickly, you can use the built-in **Reviewer Mode**.

1. Ensure you have run the seed script (`npm run seed:demo`).
2. Go to the homepage (`http://localhost:3000`).
3. Click the **Reviewer Mode** button in the top right corner.
4. This will automatically authenticate you using the seeded demo account (`reviewer@buildbot.local` / `reviewer123!`).

For a complete walkthrough, see the [REVIEWER_GUIDE.md](./REVIEWER_GUIDE.md).

---

## Creating Your First App

1. Log in (or use Reviewer Mode).
2. On the home page, enter a prompt such as: *"I need a CRM to track my sales leads, customer contacts, and deal pipelines."*
3. Click **Generate**.
4. The Generation Timeline will appear, walking you through Schema Generation, Relationship Mapping, and Sample Data Seeding.
5. Once complete, you will be redirected to your fully functional application!

---

## AI Refinement Example

You can iteratively build out your application using the **AI Refinement Panel**:
1. Open an existing generated application.
2. Click the **Refine App** button on the sidebar.
3. Type a natural language modification, e.g., *"Add invoices linked to customers."*
4. BuildBot will analyze the impact, propose a schema diff (showing added tables and relationships), and regenerate the UI seamlessly without losing your existing records.

---

## Deployment

### Deploying the Database (Neon PostgreSQL)
1. Create a project on [Neon.tech](https://neon.tech).
2. Copy the pooled Connection String.
3. Add `?pgbouncer=true&connection_limit=1` to the end of your connection string for Prisma compatibility.

### Deploying the Application (Vercel)
1. Push your repository to GitHub.
2. Import the project in Vercel.
3. Set the following Environment Variables in the Vercel dashboard:
   - `DATABASE_URL`
   - `AI_PROVIDER` (e.g. `openai`, `groq`, or `gemini`)
   - `OPENAI_API_KEY` (or the respective key for your provider)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
4. Override the build command to run migrations before building:
   - **Build Command**: `npx prisma db push && next build`
5. Click **Deploy**.

### Deploying via Docker (Railway / Render)
1. Connect your repository to Railway.
2. Railway will automatically detect the `Dockerfile`.
3. Add a PostgreSQL plugin to your Railway environment.
4. Expose the generated `DATABASE_URL` and add your AI Provider keys to the service variables.
5. The `Dockerfile` is configured to run `npx prisma migrate deploy && npm start` on boot. 
   *(Note: Ensure you have run `npx prisma migrate dev --name init` locally and committed the `prisma/migrations` folder before deploying with Docker, as `migrate deploy` requires migration files.)*

---

## Troubleshooting

### PrismaClientConstructorValidationError (Engine Type "client")
**Symptom**: When running `npx tsx prisma/seed.ts` or during `next build`, you see `Using engine type "client" requires either "adapter" or "accelerateUrl"...`
**Fix**: This is a known issue with Prisma v7 and ES module resolution in standalone scripts. Always prefix your script commands with `PRISMA_CLIENT_ENGINE_TYPE="library"`.
Example: `PRISMA_CLIENT_ENGINE_TYPE="library" npm run seed:demo`

### AI Provider Fallbacks
**Symptom**: AI Generation fails due to API limits (e.g., OpenAI rate limit).
**Fix**: Configure a fallback provider in your `.env` file.
```env
AI_PROVIDER="openai"
AI_FALLBACK_PROVIDER="groq"
GROQ_API_KEY="your-groq-key"
```
The system will automatically switch to Groq if the OpenAI request fails, ensuring uninterrupted generation.

### Seeding Failures
**Symptom**: `Failed to seed database` or Unique Constraint violations.
**Fix**: If you interrupt a seed script, the database might be left in a partial state. Reset your database using:
`npx prisma db push --force-reset`
Then run the seed script again.

### Port 3000 Conflicts
**Symptom**: `EADDRINUSE: address already in use :::3000`.
**Fix**: Another application is using port 3000. Stop it, or run BuildBot on a different port:
`npm run dev -- -p 3001`

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema and models
│   └── seed.ts             # Demo data seeding logic
├── src/
│   ├── app/                # Next.js App Router (Pages, API routes)
│   ├── core/               # Core Business Logic
│   │   ├── ai/             # OpenAI integrations, refinement, schema generation
│   │   ├── auth/           # JWT and password hashing
│   │   └── runtime/        # Dynamic UI rendering and API endpoints for generated apps
│   ├── components/         # Reusable React components (UI library)
│   └── lib/                # Singletons (Prisma, Logger, Env)
├── docker-compose.yml      # Local Docker configuration
└── postcss.config.js       # Tailwind v4 PostCSS config
```

---

## Known Limitations & Future Improvements

- **Complex Joins**: The dynamic runtime handles standard CRUD and basic relations, but deeply nested joins (e.g., filtering Orders by Customer's Address State) are not yet fully supported in the UI table filters.
- **Rate Limiting**: Currently uses an in-memory sliding window. For multi-instance production environments, this should be migrated to Redis.
- **Background Jobs**: Extremely complex prompt requests (generating >10 tables) may occasionally time out Vercel's 60-second serverless limit. Moving the generation pipeline to a background worker (e.g., Inngest) is planned for a future release.

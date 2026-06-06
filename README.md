# BuildBot AI App Generator

BuildBot is an AI-powered web app generator that transforms natural language prompts into working, standalone, frontend applications instantly. It writes pure HTML, CSS, and Vanilla JS—zero framework overhead, no dependencies. 

## Overview

Traditional software development requires boilerplate, dependency management, and configuration. BuildBot reduces this to a single step: **Describe what you want**. 

BuildBot uses advanced LLMs (OpenAI, Groq, Gemini) to scaffold clean, semantic web code. It provides an interactive workspace where you can instantly preview the result, chat with the AI to refine it iteratively, and download the raw files.

## Features

- **Instant Generation**: AI writes raw HTML, CSS, and JS in seconds.
- **Chat & Refine**: Iterative conversational UI to tweak designs and add functionality block by block.
- **Responsive Previews**: Built-in device emulators (Desktop, Tablet, Mobile) to test your app without leaving the workspace.
- **Version History**: Every refinement creates a snapshot. Roll back to any previous state with one click.
- **Instant Export**: Download your code as a standard `.zip` containing `index.html`, `style.css`, and `script.js`.
- **No Dependencies**: Clean, portable code you own forever.

---

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Components)
- **Database ORM**: [Prisma v7](https://www.prisma.io/)
- **Database Engine**: PostgreSQL
- **AI Integration**: Support for multiple providers ([OpenAI](https://openai.com/), [Groq](https://groq.com/), [Google Gemini](https://deepmind.google/technologies/gemini/)) with automatic fallback strategies.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Data Fetching**: [React Query](https://tanstack.com/query/latest)

---

## Quick Start (Local Setup)

The following steps will get BuildBot running locally on your machine.

### 1. Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL running locally or remotely (e.g., Neon, Supabase)
- An API Key (OpenAI, Groq, or Gemini)

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
Ensure you provide a valid `DATABASE_URL` and configure your preferred AI provider in the `.env` file.

### 4. Database Setup
Synchronize the Prisma schema with your database for local development.
```bash
# Generate the Prisma Client
npx prisma generate

# Push the schema to your database
npx prisma db push
```

### 5. Seed Demo Accounts
Run the seed script to create the Reviewer account:

> **Important**: Due to Prisma v7 and ES Modules constraints, explicitly set the engine type:

```bash
PRISMA_CLIENT_ENGINE_TYPE="library" npm run seed:demo
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Docker Setup

If you prefer to run the application in Docker, a `docker-compose.yml` is provided.

1. Ensure your `.env` file is properly configured.
2. Start the containers:
```bash
docker-compose up --build
```
3. Seed the database *inside* the app container:
```bash
docker exec -it buildbot-app sh -c 'PRISMA_CLIENT_ENGINE_TYPE="library" npx tsx prisma/seed.ts'
```

---

## Reviewer Mode

Use the built-in **Reviewer Mode** to quickly evaluate the project without creating an account.
1. Go to the homepage (`http://localhost:3000`).
2. Click the **Reviewer Mode** button in the top right corner.
3. This automatically authenticates you using the seeded demo account (`reviewer@buildbot.local`).

See [REVIEWER_GUIDE.md](./REVIEWER_GUIDE.md) for more details.

---

## Creating Your First App

1. Log in or use Reviewer Mode.
2. Enter a prompt like: *"A sleek calculator app with a dark mode toggle."*
3. Click **Generate**.
4. The Generation Pipeline will provision your HTML, CSS, and JS.
5. Once complete, you will be redirected to the interactive workspace.

---

## AI Refinement Example

Iteratively build out your application using the **Chat Panel**:
1. Open an existing generated application in the workspace.
2. Type a natural language modification in the chat box, e.g., *"Make the buttons larger and add a bouncy hover animation."*
3. BuildBot will analyze the request, regenerate the specific files, and save a new version snapshot.
4. Use the Version Timeline to compare or roll back changes if needed.

---

## Deployment

### Deploying the Database (Neon PostgreSQL)
1. Create a project on [Neon.tech](https://neon.tech).
2. Copy the pooled Connection String.
3. Add `?pgbouncer=true&connection_limit=1` to the end of your connection string for Prisma compatibility.

### Deploying the Application (Vercel)
1. Import the project in Vercel.
2. Set your Environment Variables (`DATABASE_URL`, `AI_PROVIDER`, `OPENAI_API_KEY`, `JWT_SECRET`, etc.).
3. Override the build command:
   - **Build Command**: `npx prisma db push && next build`
4. Deploy.

---

## Troubleshooting

### PrismaClientConstructorValidationError
**Symptom**: `Using engine type "client" requires either "adapter" or "accelerateUrl"...`
**Fix**: Prefix your script commands with `PRISMA_CLIENT_ENGINE_TYPE="library"`.
Example: `PRISMA_CLIENT_ENGINE_TYPE="library" npm run seed:demo`

### AI Provider Fallbacks
**Symptom**: AI Generation fails due to API limits.
**Fix**: Configure a fallback provider in your `.env` file.
```env
AI_PROVIDER="openai"
AI_FALLBACK_PROVIDER="groq"
GROQ_API_KEY="your-groq-key"
```

### Seeding Failures
**Symptom**: Unique Constraint violations on seed.
**Fix**: Reset your database: `npx prisma db push --force-reset`

### Port 3000 Conflicts
**Symptom**: `EADDRINUSE: address already in use :::3000` / `Another next dev server is already running`.
**Fix**: Kill the background process:
```bash
killall node
# Or explicitly:
lsof -i :3000
kill -9 <PID>
```

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema (User, Project, ProjectVersion)
│   └── seed.ts             # Demo account logic
├── src/
│   ├── app/                # Next.js App Router 
│   ├── core/               # Core Business Logic
│   │   ├── ai/             # AI Provider Factory, generation & refinement pipelines
│   │   ├── auth/           # JWT and auth middleware
│   │   └── project/        # Project and version management services
│   ├── components/         # Reusable React components & Workspace UI
│   └── lib/                # Singletons (Prisma, Env)
├── docker-compose.yml      # Local Docker configuration
└── postcss.config.js       # Tailwind v4 PostCSS config
```

# Reviewer Quick Start Guide

Welcome! We respect your time. This guide is designed to let you clone, run, and evaluate the core features of BuildBot in **under 5 minutes**.

---

## 1. ⏱️ 60-Second Setup

Ensure you have Node.js (v20+) and a local PostgreSQL database running, as well as an API Key for an AI Provider (OpenAI, Groq, or Gemini).

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-username/BuildBot.git
   cd BuildBot
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/buildbot?schema=public"
   AI_PROVIDER="openai" # Options: openai, groq, gemini
   OPENAI_API_KEY="sk-your-openai-api-key"
   JWT_SECRET="demo-secret"
   NODE_ENV="development"
   ```

3. **Initialize Database & Seed**
   Push the schema to your database and run the demo seed script (which creates the reviewer account):
   ```bash
   npx prisma generate
   npx prisma db push
   
   # Important: Set PRISMA_CLIENT_ENGINE_TYPE to avoid a known Prisma v7 bug in standalone scripts
   PRISMA_CLIENT_ENGINE_TYPE="library" npm run seed:demo
   ```

4. **Start the App**
   ```bash
   npm run dev
   ```
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 2. 🔐 Demo Login (Reviewer Mode)

You do not need to manually create an account.
1. On the landing page (`http://localhost:3000`), click the **"Reviewer Mode"** button in the top right corner.
2. This will automatically authenticate you using the pre-seeded demo account (`reviewer@buildbot.local`).

---

## 3. 🚀 Suggested Walkthrough (The "Aha!" Moment)

To experience the magic of the **AI Generation & Refinement Engine**, try the following 2-minute workflow:

1. **Generate an App**
   - On the homepage, type a prompt like: *"Create a dark-mode sleek calculator app."*
   - Click **Generate** and watch the AI write the raw HTML, CSS, and Vanilla JS.
2. **View the Workspace**
   - You will be redirected to the interactive workspace.
   - Test the app in the built-in **Preview Pane** (try switching between Desktop and Mobile views).
3. **Trigger AI Refinement**
   - Open the **Chat Panel** on the right side.
   - Type a natural language command: *"Add a bouncing hover animation to all the buttons."*
4. **Watch the Timeline**
   - BuildBot will analyze the current code and generate a new modified snapshot.
   - You can use the **Version Timeline** on the left to seamlessly roll back to the previous version if you don't like the new changes!
5. **Export Your Code**
   - Click the **Export** button to download your raw, dependency-free code as a `.zip` file instantly.

---

**That's it!** You've just used an AI agent to dynamically write, refine, and render a full web application without writing a line of code. 

For full technical details, see the [README.md](./README.md).

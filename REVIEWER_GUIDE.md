# Reviewer Quick Start Guide

Welcome! We respect your time. This guide is designed to let you clone, run, and evaluate the core features of BuildBot in **under 5 minutes**.

---

## 1. ⏱️ 60-Second Setup

Ensure you have Node.js (v20+) and a local PostgreSQL database running, as well as an OpenAI API Key.

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
   JWT_REFRESH_SECRET="demo-refresh-secret"
   NODE_ENV="development"
   ```

3. **Initialize Database & Seed**
   Push the schema to your database and run the demo seed script (which creates 3 fully populated demo apps):
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
2. This will automatically authenticate you using the pre-seeded demo account:
   - **Email:** `reviewer@buildbot.local`
   - **Password:** `reviewer123!`

---

## 3. 📦 Demo Apps Available

The seed script has pre-generated three comprehensive applications for you to explore:

1. **CRM (Customer Relationship Management)**
   - Manages *Customers*, *Deals*, *Interactions*, and *Pipelines*.
   - Evaluates: Complex relational integrity and multi-stage entity tracking.
2. **Inventory Management**
   - Tracks *Products*, *Suppliers*, and *Stock*.
   - Evaluates: Numerical aggregation fields, required enums, and boolean availability flags.
3. **Project Tracker**
   - Organizes *Projects*, *Tasks*, and *Team Members*.
   - Evaluates: Deeply nested hierarchies (Project -> Tasks -> Assigned Members).

---

## 4. 🚀 Suggested Walkthrough (The "Aha!" Moment)

To experience the magic of the **AI Refinement Engine**, try the following 2-minute workflow:

1. **Open the CRM App**
   - From your dashboard, click on the **CRM** demo app.
2. **View the Dashboard**
   - Notice the dynamically generated tables, sidebar navigation, and seeded sample data.
3. **Open Customers**
   - Click "Customers" in the sidebar. 
   - Add a new record to test the auto-generated dynamic form validation.
4. **Trigger AI Refinement**
   - Click the **Refine App** button on the bottom left of the sidebar.
5. **Issue a Natural Language Command**
   - In the prompt box, type:
     > *"Add invoices linked to customers to track billing."*
6. **Watch the Generation Timeline**
   - BuildBot will analyze the impact, construct a deterministic schema diff, and safely evolve the application schema without dropping your existing customers.
7. **Preview & Apply**
   - Look at the Schema Diff Viewer (you should see an `Invoice` entity added).
   - Once generation is complete, click into the new **Invoices** tab on the sidebar. You'll see new mock data automatically generated that properly links to your existing customers!

---

**That's it!** You've just used an AI agent to dynamically architect, migrate, and render a full-stack database feature without writing a line of code. 

For full technical details, see the [README.md](./README.md).

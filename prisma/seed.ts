import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SchemaGenerator } from '../src/core/ai/schema-generator';
import { ValidationRepairLoop } from '../src/core/ai/repair-loop';
import { RefinementPromptBuilder } from '../src/core/ai/refinement/refinement-prompt-builder';
import { draftAppService } from '../src/core/ai/draft-app-service';
import { dataSeedingService } from '../src/core/ai/data-seeding-service';
import { PromptBuilder } from '../src/core/ai/prompt-builder';

const prisma = new PrismaClient();

const crmJson = `
{
  "appName": "CRM Hub",
  "description": "Customer Relationship Management",
  "entities": [
    {
      "id": "ent_customer",
      "name": "Customer",
      "timestamps": true,
      "fields": [
        { "id": "fld_c_name", "name": "name", "type": "string", "required": true },
        { "id": "fld_c_email", "name": "email", "type": "string", "required": true },
        { "id": "fld_c_status", "name": "status", "type": "enum", "enumValues": ["Active", "Lead", "Churned"] }
      ]
    },
    {
      "id": "ent_deal",
      "name": "Deal",
      "timestamps": true,
      "fields": [
        { "id": "fld_d_title", "name": "title", "type": "string", "required": true },
        { "id": "fld_d_amount", "name": "amount", "type": "number", "required": true },
        { "id": "fld_d_stage", "name": "stage", "type": "enum", "enumValues": ["Prospect", "Negotiation", "Closed Won", "Closed Lost"] },
        { "id": "fld_d_customer", "name": "customerId", "type": "relation", "relation": { "entityId": "ent_customer", "type": "belongsTo" } }
      ]
    }
  ]
}`;

const inventoryJson = `
{
  "appName": "Inventory Pro",
  "description": "Warehouse and Stock Tracking",
  "entities": [
    {
      "id": "ent_product",
      "name": "Product",
      "timestamps": true,
      "fields": [
        { "id": "fld_p_sku", "name": "sku", "type": "string", "required": true, "unique": true },
        { "id": "fld_p_name", "name": "name", "type": "string", "required": true },
        { "id": "fld_p_price", "name": "price", "type": "number", "required": true },
        { "id": "fld_p_stock", "name": "stockLevel", "type": "number", "required": true }
      ]
    },
    {
      "id": "ent_supplier",
      "name": "Supplier",
      "timestamps": true,
      "fields": [
        { "id": "fld_s_name", "name": "name", "type": "string", "required": true },
        { "id": "fld_s_contact", "name": "contactEmail", "type": "string" }
      ]
    }
  ]
}`;

const projectJson = `
{
  "appName": "Project Tracker",
  "description": "Task and Project Management",
  "entities": [
    {
      "id": "ent_project",
      "name": "Project",
      "timestamps": true,
      "fields": [
        { "id": "fld_pr_name", "name": "name", "type": "string", "required": true },
        { "id": "fld_pr_status", "name": "status", "type": "enum", "enumValues": ["Planning", "Active", "Completed"] }
      ]
    },
    {
      "id": "ent_task",
      "name": "Task",
      "timestamps": true,
      "fields": [
        { "id": "fld_t_title", "name": "title", "type": "string", "required": true },
        { "id": "fld_t_completed", "name": "isCompleted", "type": "boolean" },
        { "id": "fld_t_project", "name": "projectId", "type": "relation", "relation": { "entityId": "ent_project", "type": "belongsTo" } }
      ]
    }
  ]
}`;

async function main() {
  console.log('Seeding Reviewer Account...');
  
  const passwordHash = await bcrypt.hash('reviewer123!', 12);
  
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@buildbot.local' },
    update: {},
    create: {
      email: 'reviewer@buildbot.local',
      name: 'Reviewer',
      passwordHash,
    },
  });

  console.log('Clearing old apps for reviewer...');
  await prisma.appDefinition.deleteMany({ where: { userId: reviewer.id } });

  console.log('Creating CRM App...');
  const crm = await draftAppService.createDraftApp(reviewer.id, crmJson, 'CRM');
  await dataSeedingService.triggerSeed(crm.app.id, reviewer.id, JSON.parse(crmJson), 'CRM');

  console.log('Creating Inventory App...');
  const inv = await draftAppService.createDraftApp(reviewer.id, inventoryJson, 'INVENTORY');
  await dataSeedingService.triggerSeed(inv.app.id, reviewer.id, JSON.parse(inventoryJson), 'INVENTORY');

  console.log('Creating Project Tracker App...');
  const proj = await draftAppService.createDraftApp(reviewer.id, projectJson, 'PROJECT_MANAGEMENT');
  await dataSeedingService.triggerSeed(proj.app.id, reviewer.id, JSON.parse(projectJson), 'PROJECT_MANAGEMENT');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

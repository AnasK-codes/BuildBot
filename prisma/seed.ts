import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing data
  await prisma.runtimeRecord.deleteMany();
  await prisma.fieldDefinition.deleteMany();
  await prisma.entityDefinition.deleteMany();
  await prisma.appDefinition.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Demo User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@buildbot.ai',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
    },
  });
  console.log(`✅ Created User: ${user.email}`);

  // 3. Create CRM Application
  const crmApp = await prisma.appDefinition.create({
    data: {
      userId: user.id,
      appName: 'CRM',
      version: 1,
      status: 'ACTIVE',
      rawDefinition: JSON.stringify({ appName: 'CRM' }),
      entities: {
        create: [
          {
            name: 'Company',
            slug: 'company',
            stableId: 'ent_crm_company',
            sortOrder: 1,
            fields: {
              create: [
                { name: 'name', stableId: 'fld_company_name', fieldType: 'string', required: true, sortOrder: 1 },
                { name: 'website', stableId: 'fld_company_website', fieldType: 'url', sortOrder: 2 },
              ]
            }
          },
          {
            name: 'Contact',
            slug: 'contact',
            stableId: 'ent_crm_contact',
            sortOrder: 2,
            fields: {
              create: [
                { name: 'fullName', stableId: 'fld_contact_name', fieldType: 'string', required: true, sortOrder: 1 },
                { name: 'email', stableId: 'fld_contact_email', fieldType: 'email', required: true, sortOrder: 2 },
                { name: 'companyId', stableId: 'fld_contact_company', fieldType: 'relation', relationTarget: 'ent_crm_company', relationType: 'belongsTo', sortOrder: 3 },
              ]
            }
          }
        ]
      }
    }
  });
  console.log(`✅ Created App: CRM`);

  // 4. Create CRM Runtime Records
  const company1 = await prisma.runtimeRecord.create({
    data: {
      appId: crmApp.id,
      userId: user.id,
      entitySlug: 'company',
      data: { name: 'Acme Corp', website: 'https://acme.com' },
    }
  });
  await prisma.runtimeRecord.create({
    data: {
      appId: crmApp.id,
      userId: user.id,
      entitySlug: 'contact',
      data: { fullName: 'John Doe', email: 'john@acme.com', companyId: company1.id },
    }
  });

  // 5. Create E-Commerce Application
  const ecomApp = await prisma.appDefinition.create({
    data: {
      userId: user.id,
      appName: 'E-Commerce',
      version: 1,
      status: 'ACTIVE',
      rawDefinition: JSON.stringify({ appName: 'E-Commerce' }),
      entities: {
        create: [
          {
            name: 'Product',
            slug: 'product',
            stableId: 'ent_ecom_product',
            sortOrder: 1,
            fields: {
              create: [
                { name: 'title', stableId: 'fld_product_title', fieldType: 'string', required: true, sortOrder: 1 },
                { name: 'price', stableId: 'fld_product_price', fieldType: 'number', required: true, sortOrder: 2 },
                { name: 'inStock', stableId: 'fld_product_stock', fieldType: 'boolean', defaultValue: 'true', sortOrder: 3 },
              ]
            }
          }
        ]
      }
    }
  });
  console.log(`✅ Created App: E-Commerce`);

  // 6. Create E-Commerce Runtime Records
  await prisma.runtimeRecord.create({
    data: {
      appId: ecomApp.id,
      userId: user.id,
      entitySlug: 'product',
      data: { title: 'Wireless Headphones', price: 199.99, inStock: true },
    }
  });

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

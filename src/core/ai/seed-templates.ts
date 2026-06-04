// ============================================================
// BuildBot — Seed Templates
// ============================================================
// Provides coherent business context for programmatic expansion.
// ============================================================

import { ArchetypeType } from './archetypes/archetype.types';

export class SeedTemplates {
  public static getContext(archetype: ArchetypeType): any {
    switch (archetype) {
      case 'CRM':
        return {
          companyNames: ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corporation'],
          personNames: ['John Smith', 'Jane Doe', 'Michael Scott', 'Sarah Connor', 'Peter Parker'],
          dealNames: ['Enterprise License', 'Q3 Renewal', 'Pilot Program', 'Service SLA', 'Hardware Upgrade']
        };
      case 'INVENTORY':
        return {
          categories: ['Electronics', 'Office Supplies', 'Furniture', 'Hardware', 'Apparel'],
          products: ['Laptop', 'Desk Chair', 'Monitor', 'Stapler', 'Keyboard'],
          suppliers: ['TechData', 'OfficeMax', 'Global Supply', 'FastShip', 'QualityGoods']
        };
      case 'PROJECT_MANAGEMENT':
        return {
          projects: ['Website Redesign', 'Mobile App Launch', 'Q2 Marketing', 'Infrastructure Migration', 'Audit'],
          tasks: ['Design Mockups', 'Setup Database', 'Write Copy', 'Review PRs', 'Deploy to Prod'],
          members: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']
        };
      case 'ECOMMERCE':
        return {
          products: ['T-Shirt', 'Sneakers', 'Watch', 'Sunglasses', 'Backpack'],
          customers: ['Alice Buyer', 'Bob Shopper', 'Charlie Consumer', 'Diana Purchaser', 'Eve Spender'],
          categories: ['Clothing', 'Footwear', 'Accessories', 'Outdoor', 'Electronics']
        };
      case 'BOOKING':
        return {
          resources: ['Conference Room A', 'Studio B', 'Vehicle 12', 'Projector', 'Main Hall'],
          customers: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
          events: ['Annual Meeting', 'Photo Shoot', 'Delivery', 'Presentation', 'Gala']
        };
      default:
        return {
          names: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
          items: ['Item A', 'Item B', 'Item C', 'Item D', 'Item E']
        };
    }
  }
}

// ============================================================
// BuildBot — Archetype Registry
// ============================================================

import { ArchetypeTemplate, ArchetypeType } from './archetype.types';

export const ArchetypeRegistry: Record<ArchetypeType, ArchetypeTemplate> = {
  CRM: {
    type: 'CRM',
    description: 'Customer Relationship Management for sales and contacts.',
    recommendedEntities: ['Customer', 'Company', 'Contact', 'Deal'],
    recommendedRelations: [
      'Customer belongsTo Company',
      'Deal belongsTo Customer'
    ]
  },
  INVENTORY: {
    type: 'INVENTORY',
    description: 'System for tracking products, categories, suppliers, and stock.',
    recommendedEntities: ['Product', 'Category', 'Supplier', 'StockMovement'],
    recommendedRelations: [
      'Product belongsTo Category',
      'Product belongsTo Supplier',
      'StockMovement belongsTo Product'
    ]
  },
  PROJECT_MANAGEMENT: {
    type: 'PROJECT_MANAGEMENT',
    description: 'Tracking projects, tasks, team members, and comments.',
    recommendedEntities: ['Project', 'Task', 'Comment', 'Member'],
    recommendedRelations: [
      'Task belongsTo Project',
      'Task belongsTo Member',
      'Comment belongsTo Task'
    ]
  },
  ECOMMERCE: {
    type: 'ECOMMERCE',
    description: 'Online store managing customers, products, and orders.',
    recommendedEntities: ['Product', 'Category', 'Customer', 'Order', 'OrderItem'],
    recommendedRelations: [
      'Product belongsTo Category',
      'Order belongsTo Customer',
      'OrderItem belongsTo Order',
      'OrderItem belongsTo Product'
    ]
  },
  HR: {
    type: 'HR',
    description: 'Human Resources tracking employees, departments, and payroll.',
    recommendedEntities: ['Employee', 'Department', 'Payroll', 'LeaveRequest'],
    recommendedRelations: [
      'Employee belongsTo Department',
      'Payroll belongsTo Employee',
      'LeaveRequest belongsTo Employee'
    ]
  },
  ERP: {
    type: 'ERP',
    description: 'Enterprise Resource Planning combining finance, supply chain, and ops.',
    recommendedEntities: ['Vendor', 'PurchaseOrder', 'Invoice', 'Ledger'],
    recommendedRelations: [
      'PurchaseOrder belongsTo Vendor',
      'Invoice belongsTo PurchaseOrder'
    ]
  },
  BOOKING: {
    type: 'BOOKING',
    description: 'Booking and reservations for events, resources, or services.',
    recommendedEntities: ['Resource', 'Booking', 'Customer', 'Payment'],
    recommendedRelations: [
      'Booking belongsTo Resource',
      'Booking belongsTo Customer',
      'Payment belongsTo Booking'
    ]
  },
  CUSTOM: {
    type: 'CUSTOM',
    description: 'Generic fallback for unrecognized application patterns.',
    recommendedEntities: [],
    recommendedRelations: []
  }
};

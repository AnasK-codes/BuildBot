// ============================================================
// BuildBot — Phase B5 Tests
// ============================================================

import { UIGenerator } from '../src/core/ui/ui-generator';
import { UIValidator } from '../src/core/ui/ui-validator';
import { AppDefinition } from '../src/types/metadata.types';

describe('Phase B5 - Deterministic UI Generator', () => {

  const mockApp: AppDefinition = {
    appName: 'Test CRM',
    description: 'Test',
    entities: [
      {
        id: 'ent_company',
        name: 'Company',
        timestamps: true,
        softDelete: true,
        fields: [
          { id: 'fld_c_name', name: 'Name', type: 'string', required: true }
        ]
      },
      {
        id: 'ent_customer',
        name: 'Customer',
        timestamps: true,
        softDelete: true,
        fields: [
          { id: 'fld_name', name: 'Name', type: 'string', required: true },
          { id: 'fld_company', name: 'Company', type: 'relation', relation: { entityId: 'ent_company', type: 'belongsTo' } }
        ]
      },
      {
        id: 'ent_deal',
        name: 'Deal',
        timestamps: true,
        softDelete: true,
        fields: [
          { id: 'fld_amount', name: 'Amount', type: 'number', required: true },
          { id: 'fld_customer', name: 'Customer', type: 'relation', relation: { entityId: 'ent_customer', type: 'belongsTo' } }
        ]
      }
    ]
  };

  it('generates a complete UI definition', () => {
    const uiDef = UIGenerator.generate(mockApp);
    
    expect(uiDef).toBeDefined();
    expect(uiDef.theme).toBeDefined();
    expect(uiDef.navigation).toBeDefined();
    expect(uiDef.pages).toBeDefined();
    
    // Check navigation (Dashboard + 3 Entities)
    expect(uiDef.navigation.items.length).toBe(4);
    expect(uiDef.navigation.items[0].label).toBe('Dashboard');
    expect(uiDef.navigation.items[1].label).toBe('Companys'); // basic plural
  });

  it('generates pages for all entities', () => {
    const uiDef = UIGenerator.generate(mockApp);
    
    // Dashboard + (List, Create, Edit, Detail) * 3 = 13 pages
    expect(uiDef.pages.length).toBe(13);

    const customerList = uiDef.pages.find(p => p.id === 'page_ent_customer_list');
    expect(customerList).toBeDefined();
    expect(customerList!.type).toBe('list');
    expect(customerList!.path).toBe('/customers');

    const customerDetail = uiDef.pages.find(p => p.id === 'page_ent_customer_detail');
    expect(customerDetail).toBeDefined();
    
    // Check child table relation in Customer detail (Deals belong to Customer)
    const detailComp = customerDetail!.layout.children[0].config as any;
    expect(detailComp.childTables).toBeDefined();
    expect(detailComp.childTables.length).toBe(1);
    expect(detailComp.childTables[0].entityId).toBe('ent_deal');
  });

  it('validates a correct UI definition without throwing', () => {
    const uiDef = UIGenerator.generate(mockApp);
    expect(() => UIValidator.validate(uiDef, mockApp)).not.toThrow();
  });

  it('throws when UI definition references non-existent entity', () => {
    const uiDef = UIGenerator.generate(mockApp);
    // Break the UI definition intentionally
    uiDef.pages[1].entityId = 'ent_ghost';
    
    expect(() => UIValidator.validate(uiDef, mockApp)).toThrow('UI references non-existent entity: ent_ghost');
  });

});

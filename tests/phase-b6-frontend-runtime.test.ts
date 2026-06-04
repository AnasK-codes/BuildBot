// ============================================================
// BuildBot — Phase B6 Tests
// ============================================================
// Tests for the Dynamic Frontend Runtime (pure logic, no rendering).
// ============================================================

import { UIGenerator } from '../src/core/ui/ui-generator';
import { UIValidator } from '../src/core/ui/ui-validator';
import { AppDefinition } from '../src/types/metadata.types';
import { AppUIDefinition, UIPage } from '../src/types/ui-metadata.types';

// ─── Shared Fixtures ──────────────────────────────────────────────────────────

const mockCrmApp: AppDefinition = {
  appName: 'CRM',
  description: 'Customer Relationship Management',
  entities: [
    {
      id: 'ent_company',
      name: 'Company',
      timestamps: true,
      softDelete: true,
      fields: [
        { id: 'fld_name', name: 'Name', type: 'string', required: true },
        { id: 'fld_industry', name: 'Industry', type: 'string', required: false },
      ]
    },
    {
      id: 'ent_customer',
      name: 'Customer',
      timestamps: true,
      softDelete: true,
      fields: [
        { id: 'fld_cname', name: 'Name', type: 'string', required: true },
        { id: 'fld_email', name: 'Email', type: 'string', required: true },
        { id: 'fld_company', name: 'Company', type: 'relation', relation: { entityId: 'ent_company', type: 'belongsTo' } },
      ]
    },
    {
      id: 'ent_deal',
      name: 'Deal',
      timestamps: true,
      softDelete: true,
      fields: [
        { id: 'fld_amount', name: 'Amount', type: 'number', required: true },
        { id: 'fld_stage', name: 'Stage', type: 'enum', enumValues: ['New', 'Negotiating', 'Won', 'Lost'], required: true },
        { id: 'fld_customer', name: 'Customer', type: 'relation', relation: { entityId: 'ent_customer', type: 'belongsTo' } },
      ]
    }
  ]
};

// ─── Dynamic Route Matching ───────────────────────────────────────────────────

function matchPage(pages: UIPage[], slug: string[]): UIPage | undefined {
  const currentPath = '/' + slug.join('/');
  const exact = pages.find(p => p.path === currentPath);
  if (exact) return exact;
  for (const page of pages) {
    const patternParts = page.path.split('/').filter(Boolean);
    const slugParts = slug.filter(Boolean);
    if (patternParts.length !== slugParts.length) continue;
    const isMatch = patternParts.every((part, i) => part.startsWith(':') || part === slugParts[i]);
    if (isMatch) return page;
  }
  return undefined;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Phase B6 — Dynamic Frontend Runtime', () => {

  let uiDef: AppUIDefinition;

  beforeAll(() => {
    uiDef = UIGenerator.generate(mockCrmApp);
  });

  // ─── Navigation Generation ─────────────────────────────────────────────────
  describe('Navigation Generation', () => {
    it('has Dashboard as first navigation item', () => {
      expect(uiDef.navigation.items[0].label).toBe('Dashboard');
      expect(uiDef.navigation.items[0].path).toBe('/');
    });

    it('assigns correct icons to known entity types', () => {
      const customerNav = uiDef.navigation.items.find(n => n.label.toLowerCase().includes('customer'));
      expect(customerNav?.icon).toBe('Users');
    });

    it('generates navigation for all entities', () => {
      // Dashboard + 3 entities = 4 items
      expect(uiDef.navigation.items).toHaveLength(4);
    });
  });

  // ─── Page Generation ───────────────────────────────────────────────────────
  describe('Page Generation', () => {
    it('generates correct number of pages (1 dashboard + 4 per entity)', () => {
      // 1 dashboard + (list, create, edit, detail) * 3 = 13
      expect(uiDef.pages).toHaveLength(13);
    });

    it('generates a list page for each entity', () => {
      expect(uiDef.pages.find(p => p.id === 'page_ent_company_list')).toBeDefined();
      expect(uiDef.pages.find(p => p.id === 'page_ent_customer_list')).toBeDefined();
      expect(uiDef.pages.find(p => p.id === 'page_ent_deal_list')).toBeDefined();
    });

    it('generates create, edit and detail pages for each entity', () => {
      expect(uiDef.pages.find(p => p.id === 'page_ent_customer_create')).toBeDefined();
      expect(uiDef.pages.find(p => p.id === 'page_ent_customer_edit')).toBeDefined();
      expect(uiDef.pages.find(p => p.id === 'page_ent_customer_detail')).toBeDefined();
    });

    it('puts required fields first in create/edit forms', () => {
      const createPage = uiDef.pages.find(p => p.id === 'page_ent_customer_create')!;
      const formConfig = createPage.layout.children[0].config as any;
      const firstRequired = formConfig.fields.findIndex((f: any) => f.required);
      const firstOptional = formConfig.fields.findIndex((f: any) => !f.required);
      // All required fields should come before optional ones
      expect(firstRequired).toBeLessThan(firstOptional === -1 ? Infinity : firstOptional);
    });

    it('maps enum fields to select controls in forms', () => {
      const createPage = uiDef.pages.find(p => p.id === 'page_ent_deal_create')!;
      const formConfig = createPage.layout.children[0].config as any;
      const stageField = formConfig.fields.find((f: any) => f.fieldId === 'fld_stage');
      expect(stageField?.controlType).toBe('select');
    });

    it('maps relation fields to select controls in forms', () => {
      const createPage = uiDef.pages.find(p => p.id === 'page_ent_customer_create')!;
      const formConfig = createPage.layout.children[0].config as any;
      const companyField = formConfig.fields.find((f: any) => f.fieldId === 'fld_company');
      expect(companyField?.controlType).toBe('select');
    });

    it('populates child tables on detail pages', () => {
      // Company detail should have Customer as a child (Customer belongsTo Company)
      const companyDetail = uiDef.pages.find(p => p.id === 'page_ent_company_detail')!;
      const detailConfig = companyDetail.layout.children[0].config as any;
      const customerChild = detailConfig.childTables.find((ct: any) => ct.entityId === 'ent_customer');
      expect(customerChild).toBeDefined();
    });

    it('correctly assigns first 5 scalar fields as table columns', () => {
      const listPage = uiDef.pages.find(p => p.id === 'page_ent_company_list')!;
      const tableConfig = listPage.layout.children[0].config as any;
      expect(tableConfig.columns.length).toBeLessThanOrEqual(5);
      expect(tableConfig.columns.every((c: any) => !!c.fieldId && !!c.label)).toBe(true);
    });
  });

  // ─── Dashboard Generation ──────────────────────────────────────────────────
  describe('Dashboard Generation', () => {
    it('generates a dashboard page', () => {
      const dashboard = uiDef.pages.find(p => p.type === 'dashboard');
      expect(dashboard).toBeDefined();
    });

    it('generates metric widgets for top entities', () => {
      const dashboard = uiDef.pages.find(p => p.type === 'dashboard')!;
      const metrics = dashboard.layout.children.filter(c => c.type === 'widget-metric');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.length).toBeLessThanOrEqual(4);
    });

    it('generates a recent records widget', () => {
      const dashboard = uiDef.pages.find(p => p.type === 'dashboard')!;
      const recent = dashboard.layout.children.find(c => c.type === 'widget-recent');
      expect(recent).toBeDefined();
    });
  });

  // ─── Dynamic Route Matching ────────────────────────────────────────────────
  describe('Dynamic Route Matching', () => {
    it('matches exact paths (list page)', () => {
      const page = matchPage(uiDef.pages, ['companys']);
      expect(page?.type).toBe('list');
    });

    it('matches parameterized detail path (/entitys/:id)', () => {
      const page = matchPage(uiDef.pages, ['companys', 'rec_abc123']);
      expect(page?.type).toBe('detail');
    });

    it('matches nested parameterized edit path (/entitys/:id/edit)', () => {
      const page = matchPage(uiDef.pages, ['companys', 'rec_abc123', 'edit']);
      expect(page?.type).toBe('edit');
    });

    it('returns undefined for unknown paths', () => {
      const page = matchPage(uiDef.pages, ['unknown', 'path', 'deep']);
      expect(page).toBeUndefined();
    });
  });

  // ─── ComponentRegistry / Validation ────────────────────────────────────────
  describe('UI Validation', () => {
    it('passes validation for well-formed UI definition', () => {
      expect(() => UIValidator.validate(uiDef, mockCrmApp)).not.toThrow();
    });

    it('detects duplicate page IDs', () => {
      const brokenDef: AppUIDefinition = {
        ...uiDef,
        pages: [uiDef.pages[0], { ...uiDef.pages[0] }]
      };
      expect(() => UIValidator.validate(brokenDef, mockCrmApp)).toThrow(/Duplicate page ID/);
    });

    it('detects broken entity references', () => {
      const brokenDef: AppUIDefinition = JSON.parse(JSON.stringify(uiDef));
      brokenDef.pages[1].entityId = 'ent_nonexistent';
      expect(() => UIValidator.validate(brokenDef, mockCrmApp)).toThrow(/non-existent entity/);
    });
  });

  // ─── Theme Generation ─────────────────────────────────────────────────────
  describe('Theme Generation', () => {
    it('generates a theme with required color keys', () => {
      expect(uiDef.theme.colors.primary).toBeDefined();
      expect(uiDef.theme.colors.background).toBeDefined();
      expect(uiDef.theme.colors.surface).toBeDefined();
      expect(uiDef.theme.colors.text).toBeDefined();
    });

    it('generates a valid typography config', () => {
      expect(uiDef.theme.typography.fontFamily).toBeTruthy();
    });

    it('defaults to light mode', () => {
      expect(uiDef.theme.mode).toBe('light');
    });
  });

});

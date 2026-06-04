// ============================================================
// BuildBot — Phase B7 Refinement Tests
// ============================================================

import { refinementGenerator } from '../src/core/ai/refinement/refinement-generator';
import { ContextAggregator } from '../src/core/ai/refinement/context-aggregator';
import { EvolutionReportGenerator } from '../src/core/evolution/report-generator';
import { AppDefinition } from '../src/types/metadata.types';

// Mock dependencies
jest.mock('../src/core/ai/refinement/context-aggregator');
jest.mock('../src/core/ai/schema-generator', () => ({
  SchemaGenerator: jest.fn().mockImplementation(() => ({
    generateJSON: jest.fn()
  }))
}));
jest.mock('../src/core/ai/repair-loop', () => ({
  ValidationRepairLoop: jest.fn().mockImplementation(() => ({
    execute: jest.fn()
  }))
}));
jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    appDefinition: {
      update: jest.fn().mockResolvedValue({})
    }
  }
}));
jest.mock('../src/core/ai/data-seeding-service', () => ({
  dataSeedingService: {
    triggerSeed: jest.fn()
  }
}));

describe('Phase B7 - AI Refinement Engine', () => {
  const mockOriginalAppDef: AppDefinition = {
    id: "app_1",
    appName: "Test App",
    entities: [
      {
        id: "ent_1",
        name: "Customer",
        timestamps: true,
        fields: [
          { id: "fld_1", name: "name", type: "string" }
        ]
      }
    ]
  };

  const mockRefinedAppDef: AppDefinition = {
    id: "app_1",
    appName: "Test App",
    entities: [
      {
        id: "ent_1",
        name: "Customer",
        timestamps: true,
        fields: [
          { id: "fld_1", name: "name", type: "string" },
          { id: "fld_4", name: "email", type: "string" }
        ]
      },
      {
        id: "ent_2",
        name: "Invoice",
        timestamps: true,
        fields: [
          { id: "fld_2", name: "amount", type: "number" },
          {
            id: "fld_3",
            name: "customerId",
            type: "relation",
            relation: { entityId: "ent_1", type: "belongsTo" }
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (ContextAggregator.loadContext as jest.Mock).mockResolvedValue({
      appId: "app_1",
      version: 1,
      appDefinition: mockOriginalAppDef,
      uiDefinition: { navigation: [], theme: {} },
      entityGraph: "Mock Graph"
    });

    // Mock repair loop to return the refined def
    (refinementGenerator as any).repairLoop.execute.mockResolvedValue({
      report: { valid: true, errors: [] },
      appDefinition: mockRefinedAppDef,
      json: JSON.stringify(mockRefinedAppDef)
    });
  });

  describe('Refinement Preview', () => {
    it('should generate a correct preview for added entities', async () => {
      const preview = await refinementGenerator.preview("app_1", "Add invoices linked to customers");

      expect(preview.addedEntities).toContain("Invoice");
      expect(preview.removedEntities.length).toBe(0);
      expect(preview.addedFields.length).toBe(1);
      expect(preview.addedFields[0].field).toBe("email");
      expect(preview.safeChanges).toBeGreaterThan(0);
      expect(preview.breakingChanges).toBe(0);
    });
  });

  describe('Refinement Apply', () => {
    it('should persist a new version with the refined definition', async () => {
      const result = await refinementGenerator.apply("app_1", "user_1", "Add invoices linked to customers");

      expect(result.appId).toBe("app_1");
      expect(result.newVersion).toBe(2);
      expect(result.evolutionReport.summary.totalChanges).toBeGreaterThan(0);
      
      const prismaUpdate = require('../src/lib/prisma').default.appDefinition.update;
      expect(prismaUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "app_1" },
        data: expect.objectContaining({ version: 2 })
      }));
    });

    it('should trigger sample data generation only for new entities', async () => {
      await refinementGenerator.apply("app_1", "user_1", "Add invoices linked to customers");

      const seedMock = require('../src/core/ai/data-seeding-service').dataSeedingService.triggerSeed;
      expect(seedMock).toHaveBeenCalled();
      
      // Ensure it passed only the new entity to the seeder
      const partialDef = seedMock.mock.calls[0][2];
      expect(partialDef.entities.length).toBe(1);
      expect(partialDef.entities[0].name).toBe("Invoice");
    });
  });

  describe('Schema Evolution Diffing', () => {
    it('should correctly identify renamed fields using stable IDs', () => {
      const renamedDef: AppDefinition = JSON.parse(JSON.stringify(mockOriginalAppDef));
      renamedDef.entities[0].fields[0].name = "fullName";

      const report = EvolutionReportGenerator.generate(mockOriginalAppDef, renamedDef);
      
      expect(report.summary.highestSeverity).toBe('WARNING');
      expect(report.warningChanges.length).toBe(1);
      expect(report.warningChanges[0].type).toBe('FIELD_RENAMED');
      expect(report.warningChanges[0].oldValue).toBe('name');
      expect(report.warningChanges[0].newValue).toBe('fullName');
    });
  });
});

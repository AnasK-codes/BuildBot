// ============================================================
// BuildBot — Phase B4 Tests
// ============================================================

import { TopologicalSorter } from '../src/core/ai/topological-sorter';
import { SeedTemplates } from '../src/core/ai/seed-templates';
import { dataSeedingService } from '../src/core/ai/data-seeding-service';
import { AppDefinition } from '../src/types/metadata.types';
import { OperationExecutor } from '../src/core/runtime/operation-executor';

jest.mock('../src/core/runtime/operation-executor');

jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {}
}));

describe('Phase B4 - Sample Data Generation Engine', () => {

  describe('TopologicalSorter', () => {
    it('sorts entities so that targets of belongsTo are seeded before children', () => {
      const mockApp: any = {
        entities: [
          {
            id: 'ent_deal',
            name: 'Deal',
            fields: [
              { type: 'relation', relation: { type: 'belongsTo', entityId: 'ent_customer' } }
            ]
          },
          {
            id: 'ent_customer',
            name: 'Customer',
            fields: [
              { type: 'relation', relation: { type: 'belongsTo', entityId: 'ent_company' } }
            ]
          },
          {
            id: 'ent_company',
            name: 'Company',
            fields: []
          }
        ]
      };

      const sorted = TopologicalSorter.sortEntities(mockApp);
      
      const ids = sorted.map(e => e.id);
      expect(ids).toEqual(['ent_company', 'ent_customer', 'ent_deal']);
    });
  });

  describe('SeedTemplates', () => {
    it('returns CRM template for CRM archetype', () => {
      const context = SeedTemplates.getContext('CRM');
      expect(context.companyNames).toBeDefined();
      expect(context.personNames).toBeDefined();
    });

    it('returns generic fallback for CUSTOM archetype', () => {
      const context = SeedTemplates.getContext('CUSTOM');
      expect(context.names).toBeDefined();
    });
  });

  describe('DataSeedingService', () => {
    it('triggers seed and updates status map', async () => {
      const mockApp: any = {
        entities: [
          {
            id: 'ent_customer',
            name: 'Customer',
            fields: [
              { id: 'fld_name', name: 'Name', type: 'string' }
            ]
          }
        ]
      };

      // Ensure mock doesn't throw
      (OperationExecutor.prototype.create as jest.Mock).mockResolvedValue({
        data: { id: 'rec_123' }
      });

      // Call it synchronously to await results in the test
      await (dataSeedingService as any).seed('app_1', 'user_1', mockApp, 'CRM');

      const status = dataSeedingService.getStatus('app_1');
      expect(status.status).toBe('COMPLETED');
    });

    it('gracefully handles failures and updates status', async () => {
      const mockApp: any = {
        entities: [
          {
            id: 'ent_fail',
            name: 'Failer',
            fields: []
          }
        ]
      };

      // Mock an error inside sorting to trigger outer catch
      jest.spyOn(TopologicalSorter, 'sortEntities').mockImplementationOnce(() => {
        throw new Error('Test Failure');
      });

      await (dataSeedingService as any).seed('app_1', 'user_1', mockApp, 'CRM');

      const status = dataSeedingService.getStatus('app_1');
      expect(status.status).toBe('FAILED');
      expect(status.message).toBe('Test Failure');
    });
  });

});

// ============================================================
// BuildBot — AI Generation Tests
// ============================================================

import { ValidationRepairLoop } from '../src/core/ai/repair-loop';
import { ProviderFactory } from '../src/core/ai/providers/provider-factory';

jest.mock('../src/core/ai/providers/provider-factory', () => ({
  ProviderFactory: {
    getProvider: jest.fn().mockReturnValue({
      generateSchema: jest.fn(),
      generateRepair: jest.fn()
    })
  }
}));

describe('AI Generation Service - Phase B1', () => {
  let repairLoop: ValidationRepairLoop;
  let mockProvider: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider = ProviderFactory.getProvider();
    repairLoop = new ValidationRepairLoop(mockProvider);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ValidationRepairLoop', () => {
    it('returns immediately on first successful validation', async () => {
      const validApp = {
        appName: "Test App",
        entities: [
          {
            id: "ent_1",
            name: "Test",
            timestamps: true,
            fields: [
              { id: "fld_1", name: "name", type: "string" }
            ]
          }
        ]
      };

      mockProvider.generateSchema.mockResolvedValueOnce(JSON.stringify(validApp));

      const result = await repairLoop.execute('system', 'user');

      expect(mockProvider.generateSchema).toHaveBeenCalledTimes(1);
      expect(result.report.valid).toBe(true);
      expect(result.appDefinition?.appName).toBe("Test App");
    });

    it('retries when validation fails and succeeds on second attempt', async () => {
      const invalidApp = {
        appName: "Test App",
        entities: [
          {
            id: "ent_1",
            name: "Test",
            timestamps: true,
            fields: [
              { id: "fld_1", name: "name", type: "invalid_type" }
            ]
          }
        ]
      };

      const fixedApp = {
        appName: "Test App",
        entities: [
          {
            id: "ent_1",
            name: "Test",
            timestamps: true,
            fields: [
              { id: "fld_1", name: "name", type: "string" }
            ]
          }
        ]
      };

      mockProvider.generateSchema.mockResolvedValueOnce(JSON.stringify(invalidApp));
      mockProvider.generateRepair.mockResolvedValueOnce(JSON.stringify(fixedApp));

      const result = await repairLoop.execute('system', 'user');

      expect(mockProvider.generateSchema).toHaveBeenCalledTimes(1);
      expect(mockProvider.generateRepair).toHaveBeenCalledTimes(1);
      expect(result.report.valid).toBe(true);
    });

    it('returns invalid result after max attempts', async () => {
      const invalidJson = JSON.stringify({
        appName: "Test App",
        entities: [
          {
            id: "ent_1",
            name: "Test",
            timestamps: true,
            fields: [
              { id: "fld_1", name: "name", type: "invalid_type" }
            ]
          }
        ]
      });

      const schemaSpy = jest.spyOn(mockProvider, 'generateSchema').mockResolvedValue(invalidJson);
      const repairSpy = jest.spyOn(mockProvider, 'generateRepair').mockResolvedValue(invalidJson);

      const result = await repairLoop.execute('system', 'user', 3);

      expect(schemaSpy).toHaveBeenCalledTimes(1);
      expect(repairSpy).toHaveBeenCalledTimes(2);
      expect(result.report.valid).toBe(false);
      expect(result.appDefinition).toBeNull();
    });
  });
});

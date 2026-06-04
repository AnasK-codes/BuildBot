// ============================================================
// BuildBot — AI Generation Tests
// ============================================================

import { ValidationRepairLoop } from '../src/core/ai/repair-loop';
import { SchemaGenerator } from '../src/core/ai/schema-generator';

// Mock OpenAI so we don't make real network calls in tests
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      }
    }
  }));
});

describe('AI Generation Service - Phase B1', () => {
  let schemaGenerator: SchemaGenerator;
  let repairLoop: ValidationRepairLoop;

  beforeEach(() => {
    // We can spy on the generator's method directly
    schemaGenerator = new SchemaGenerator();
    repairLoop = new ValidationRepairLoop(schemaGenerator);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ValidationRepairLoop', () => {
    it('returns immediately on first successful validation', async () => {
      const validJson = JSON.stringify({
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
      });

      const spy = jest.spyOn(schemaGenerator, 'generateJSON').mockResolvedValueOnce(validJson);

      const result = await repairLoop.execute('system', 'user');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result.report.valid).toBe(true);
      expect(result.appDefinition?.appName).toBe("Test App");
    });

    it('retries when validation fails and succeeds on second attempt', async () => {
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

      const validJson = JSON.stringify({
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
      });

      const spy = jest.spyOn(schemaGenerator, 'generateJSON')
        .mockResolvedValueOnce(invalidJson)
        .mockResolvedValueOnce(validJson);

      const result = await repairLoop.execute('system', 'user');

      expect(spy).toHaveBeenCalledTimes(2);
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

      const spy = jest.spyOn(schemaGenerator, 'generateJSON').mockResolvedValue(invalidJson);

      const result = await repairLoop.execute('system', 'user', 3);

      expect(spy).toHaveBeenCalledTimes(3);
      expect(result.report.valid).toBe(false);
      expect(result.appDefinition).toBeNull();
    });
  });
});

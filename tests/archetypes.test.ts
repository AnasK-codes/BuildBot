// ============================================================
// BuildBot — Archetype Tests
// ============================================================

import { IntentClassifier } from '../src/core/ai/archetypes/intent-classifier';
import { ArchetypeRegistry } from '../src/core/ai/archetypes/archetype-registry';
import { ArchetypeAugmentor } from '../src/core/ai/archetypes/archetype-augmentor';
import { PromptBuilder } from '../src/core/ai/prompt-builder';

describe('Phase B2 - Archetype System', () => {

  describe('IntentClassifier', () => {
    it('detects CRM archetype correctly', () => {
      const result = IntentClassifier.detectArchetype('Create a CRM for my sales team');
      expect(result.type).toBe('CRM');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('detects INVENTORY archetype correctly', () => {
      const result = IntentClassifier.detectArchetype('Inventory tracking system for warehouse');
      expect(result.type).toBe('INVENTORY');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('falls back to CUSTOM for unknown patterns', () => {
      const result = IntentClassifier.detectArchetype('Create an app to track my pet iguanas');
      expect(result.type).toBe('CUSTOM');
      expect(result.confidence).toBe(0);
    });
  });

  describe('ArchetypeAugmentor', () => {
    it('builds context when confidence is high', () => {
      const detection = { type: 'CRM' as const, confidence: 0.8 };
      const context = ArchetypeAugmentor.buildAugmentedContext(detection);
      expect(context).not.toBeNull();
      expect(context).toContain('Customer Relationship Management');
      expect(context).toContain('Customer belongsTo Company');
    });

    it('returns null when confidence is low', () => {
      const detection = { type: 'CRM' as const, confidence: 0.5 };
      const context = ArchetypeAugmentor.buildAugmentedContext(detection);
      expect(context).toBeNull();
    });

    it('returns null for CUSTOM archetype', () => {
      const detection = { type: 'CUSTOM' as const, confidence: 1.0 };
      const context = ArchetypeAugmentor.buildAugmentedContext(detection);
      expect(context).toBeNull();
    });
  });

  describe('PromptBuilder', () => {
    it('includes augmented context in system prompt', () => {
      const detection = { type: 'INVENTORY' as const, confidence: 0.9 };
      const context = ArchetypeAugmentor.buildAugmentedContext(detection);
      
      const prompt = PromptBuilder.buildSystemPrompt(context);
      expect(prompt).toContain('Archetype Guidance (INVENTORY)');
      expect(prompt).toContain('StockMovement belongsTo Product');
    });

    it('handles null context gracefully', () => {
      const prompt = PromptBuilder.buildSystemPrompt(null);
      expect(prompt).toContain('Principal Backend Architect');
      expect(prompt).not.toContain('Archetype Guidance');
    });
  });

});

import { describe, it, expect } from 'vitest';
import { generateJSONExport } from '@/lib/csv/exporter';
import { Analysis, CSVData } from '@/lib/types';

describe('Exporter', () => {
  const mockCSVData: CSVData = {
    headers: ['id', 'response'],
    rows: [
      ['1', 'I love the product'],
      ['2', 'Could be better'],
      ['3', 'Great experience'],
    ],
    rowCount: 3,
  };

  const mockAnalysis: Analysis = {
    id: 'analysis_1',
    themes: [
      {
        id: 'theme_1',
        name: 'Positive Feedback',
        description: 'Customers expressing satisfaction',
        responseIndices: [0, 2],
        representativeQuotes: ['I love the product', 'Great experience'],
        count: 2,
        percentage: 66.67,
        confidence: 0.9,
      },
      {
        id: 'theme_2',
        name: 'Improvement Suggestions',
        description: 'Areas for enhancement',
        responseIndices: [1],
        representativeQuotes: ['Could be better'],
        count: 1,
        percentage: 33.33,
        confidence: 0.85,
      },
    ],
    totalResponses: 3,
    assignedCount: 3,
    unassignedIndices: [],
    coveragePercentage: 100,
    processingTime: 1500,
    modelUsed: 'gemini-3-flash-preview',
    createdAt: new Date('2024-01-01'),
  };

  describe('generateJSONExport', () => {
    it('should generate valid JSON with metadata', () => {
      const json = generateJSONExport(mockAnalysis, mockCSVData, 'response');
      const parsed = JSON.parse(json);

      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.totalResponses).toBe(3);
      expect(parsed.metadata.themesCount).toBe(2);
      expect(parsed.metadata.coveragePercentage).toBe(100);
    });

    it('should include all themes', () => {
      const json = generateJSONExport(mockAnalysis, mockCSVData, 'response');
      const parsed = JSON.parse(json);

      expect(parsed.themes).toHaveLength(2);
      expect(parsed.themes[0].name).toBe('Positive Feedback');
      expect(parsed.themes[1].name).toBe('Improvement Suggestions');
    });

    it('should map responses to themes correctly', () => {
      const json = generateJSONExport(mockAnalysis, mockCSVData, 'response');
      const parsed = JSON.parse(json);

      expect(parsed.responses).toHaveLength(3);
      expect(parsed.responses[0].themeName).toBe('Positive Feedback');
      expect(parsed.responses[1].themeName).toBe('Improvement Suggestions');
      expect(parsed.responses[2].themeName).toBe('Positive Feedback');
    });

    it('should include response text', () => {
      const json = generateJSONExport(mockAnalysis, mockCSVData, 'response');
      const parsed = JSON.parse(json);

      expect(parsed.responses[0].text).toBe('I love the product');
      expect(parsed.responses[1].text).toBe('Could be better');
    });
  });
});

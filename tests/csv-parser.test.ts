import { describe, it, expect } from 'vitest';
import { getColumnPreview } from '@/lib/csv/parser';
import { CSVData } from '@/lib/types';

describe('CSV Parser', () => {
  const mockCSVData: CSVData = {
    headers: ['id', 'response', 'date'],
    rows: [
      ['1', 'I love the product', '2024-01-01'],
      ['2', 'Could be better', '2024-01-02'],
      ['3', 'Great experience', '2024-01-03'],
      ['4', '', '2024-01-04'],
      ['5', 'Needs improvement', '2024-01-05'],
    ],
    rowCount: 5,
  };

  describe('getColumnPreview', () => {
    it('should return values from the specified column', () => {
      const preview = getColumnPreview(mockCSVData, 'response');
      expect(preview).toContain('I love the product');
      expect(preview).toContain('Could be better');
    });

    it('should filter out empty values', () => {
      const preview = getColumnPreview(mockCSVData, 'response');
      expect(preview).not.toContain('');
      expect(preview.length).toBe(4); // 5 rows minus 1 empty
    });

    it('should respect the limit parameter', () => {
      const preview = getColumnPreview(mockCSVData, 'response', 2);
      expect(preview.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array for non-existent column', () => {
      const preview = getColumnPreview(mockCSVData, 'nonexistent');
      expect(preview).toEqual([]);
    });
  });
});

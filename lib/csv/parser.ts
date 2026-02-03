import Papa from 'papaparse';
import { CSVData, FileMetadata } from '@/lib/types';

const MIN_RESPONSES = 10;
const MAX_RESPONSES = 10000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: CSVData;
  metadata?: FileMetadata;
}

export async function parseCSVFile(file: File): Promise<ValidationResult> {
  const errors: string[] = [];

  // Validate file type
  if (!file.name.endsWith('.csv')) {
    errors.push('File must be a CSV file (.csv extension)');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return new Promise((resolve) => {
    Papa.parse<string[]>(file, {
      complete: (results) => {
        const validationResult = validateCSVData(results, file);
        resolve(validationResult);
      },
      error: (error) => {
        resolve({
          isValid: false,
          errors: [`Failed to parse CSV: ${error.message}`],
        });
      },
      header: false,
      skipEmptyLines: true,
      encoding: 'UTF-8',
    });
  });
}

function validateCSVData(
  results: Papa.ParseResult<string[]>,
  file: File
): ValidationResult {
  const errors: string[] = [];

  if (!results.data || results.data.length === 0) {
    errors.push('CSV file is empty');
    return { isValid: false, errors };
  }

  // First row is headers
  const headers = results.data[0];
  const rows = results.data.slice(1);

  // Validate row count (excluding header)
  if (rows.length < MIN_RESPONSES) {
    errors.push(`CSV must contain at least ${MIN_RESPONSES} responses (found ${rows.length})`);
  }

  if (rows.length > MAX_RESPONSES) {
    errors.push(`CSV must contain no more than ${MAX_RESPONSES} responses (found ${rows.length})`);
  }

  // Validate columns
  if (headers.length === 0) {
    errors.push('CSV must have at least one column');
  }

  // Check for empty headers
  const emptyHeaders = headers.filter((h) => !h || h.trim() === '');
  if (emptyHeaders.length > 0) {
    errors.push('All columns must have headers');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Create CSV data structure
  const csvData: CSVData = {
    headers,
    rows,
    rowCount: rows.length,
  };

  // Create file metadata
  const metadata: FileMetadata = {
    id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    filename: file.name,
    size: file.size,
    uploadTime: new Date(),
    rowCount: rows.length,
    columnCount: headers.length,
    columns: headers,
    validationStatus: 'valid',
  };

  return {
    isValid: true,
    errors: [],
    data: csvData,
    metadata,
  };
}

export function getColumnPreview(csvData: CSVData, columnName: string, limit = 10): string[] {
  const columnIndex = csvData.headers.indexOf(columnName);
  if (columnIndex === -1) return [];

  return csvData.rows
    .slice(0, limit)
    .map((row) => row[columnIndex] || '')
    .filter((val) => val.trim() !== '');
}

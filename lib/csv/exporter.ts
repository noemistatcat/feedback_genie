import { Parser } from 'json2csv';
import { Analysis, CSVData } from '@/lib/types';

export interface ExportRow {
  response_index: number;
  response_text: string;
  theme_name: string;
  theme_description: string;
  theme_percentage: number;
  confidence?: number;
}

export function generateCSVExport(
  analysis: Analysis,
  csvData: CSVData,
  selectedColumn: string
): string {
  const columnIndex = csvData.headers.indexOf(selectedColumn);
  const rows: ExportRow[] = [];

  // Create a map of response index to theme
  const responseToTheme = new Map<number, typeof analysis.themes[0]>();
  analysis.themes.forEach((theme) => {
    theme.responseIndices.forEach((idx) => {
      responseToTheme.set(idx, theme);
    });
  });

  // Generate rows for all responses
  for (let i = 0; i < csvData.rowCount; i++) {
    const theme = responseToTheme.get(i);
    const responseText = csvData.rows[i]?.[columnIndex] || '';

    rows.push({
      response_index: i,
      response_text: responseText,
      theme_name: theme?.name || 'Unassigned',
      theme_description: theme?.description || 'No theme assigned',
      theme_percentage: theme?.percentage || 0,
      confidence: theme?.confidence,
    });
  }

  // Convert to CSV
  const parser = new Parser({
    fields: [
      { label: 'Response Index', value: 'response_index' },
      { label: 'Response Text', value: 'response_text' },
      { label: 'Theme Name', value: 'theme_name' },
      { label: 'Theme Description', value: 'theme_description' },
      { label: 'Theme Percentage', value: 'theme_percentage' },
      { label: 'Confidence', value: 'confidence' },
    ],
  });

  return parser.parse(rows);
}

export interface JSONExport {
  metadata: {
    exportDate: string;
    totalResponses: number;
    themesCount: number;
    coveragePercentage: number;
    processingTime: number;
    modelUsed: string;
  };
  themes: {
    id: string;
    name: string;
    description: string;
    count: number;
    percentage: number;
    confidence?: number;
    representativeQuotes: string[];
  }[];
  responses: {
    index: number;
    text: string;
    themeId: string | null;
    themeName: string;
  }[];
}

export function generateJSONExport(
  analysis: Analysis,
  csvData: CSVData,
  selectedColumn: string
): string {
  const columnIndex = csvData.headers.indexOf(selectedColumn);

  // Create a map of response index to theme
  const responseToTheme = new Map<number, typeof analysis.themes[0]>();
  analysis.themes.forEach((theme) => {
    theme.responseIndices.forEach((idx) => {
      responseToTheme.set(idx, theme);
    });
  });

  const exportData: JSONExport = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalResponses: analysis.totalResponses,
      themesCount: analysis.themes.length,
      coveragePercentage: analysis.coveragePercentage,
      processingTime: analysis.processingTime,
      modelUsed: analysis.modelUsed,
    },
    themes: analysis.themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      count: theme.count,
      percentage: theme.percentage,
      confidence: theme.confidence,
      representativeQuotes: theme.representativeQuotes,
    })),
    responses: Array.from({ length: csvData.rowCount }, (_, i) => {
      const theme = responseToTheme.get(i);
      return {
        index: i,
        text: csvData.rows[i]?.[columnIndex] || '',
        themeId: theme?.id || null,
        themeName: theme?.name || 'Unassigned',
      };
    }),
  };

  return JSON.stringify(exportData, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

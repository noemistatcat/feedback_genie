// Core data types for the Theme Explorer application

export interface FileMetadata {
  id: string;
  filename: string;
  size: number;
  uploadTime: Date;
  rowCount: number;
  columnCount: number;
  columns: string[];
  validationStatus: 'valid' | 'invalid' | 'pending';
  validationErrors?: string[];
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  responseIndices: number[];
  representativeQuotes: string[];
  count: number;
  percentage: number;
  confidence?: number;
}

export interface Analysis {
  id: string;
  themes: Theme[];
  totalResponses: number;
  assignedCount: number;
  unassignedIndices: number[];
  coveragePercentage: number;
  processingTime: number;
  modelUsed: string;
  createdAt: Date;
}

export interface CSVData {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export interface AppState {
  // File upload state
  file: FileMetadata | null;
  csvData: CSVData | null;
  selectedColumn: string | null;

  // Analysis state
  analysis: Analysis | null;
  isAnalyzing: boolean;
  analysisError: string | null;

  // UI state
  isExporting: boolean;
  activeView: 'themes' | 'codeframe';
}

export type AppAction =
  | { type: 'SET_FILE'; payload: { file: FileMetadata; csvData: CSVData } }
  | { type: 'SET_SELECTED_COLUMN'; payload: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'ANALYSIS_SUCCESS'; payload: Analysis }
  | { type: 'ANALYSIS_ERROR'; payload: string }
  | { type: 'UPDATE_THEME'; payload: { themeId: string; updates: Partial<Theme> } }
  | { type: 'DELETE_THEME'; payload: string }
  | { type: 'MERGE_THEMES'; payload: { sourceId: string; targetId: string } }
  | { type: 'REASSIGN_RESPONSE'; payload: { responseIndex: number; newThemeId: string } }
  | { type: 'ADD_THEME_TO_RESPONSE'; payload: { responseIndex: number; themeId: string } }
  | { type: 'SPLIT_THEME'; payload: { sourceThemeId: string; newThemeName: string; newThemeDescription: string; responseIndicesToMove: number[] } }
  | { type: 'CREATE_THEME'; payload: { name: string; description: string } }
  | { type: 'SET_ACTIVE_VIEW'; payload: 'themes' | 'codeframe' }
  | { type: 'START_EXPORT' }
  | { type: 'FINISH_EXPORT' }
  | { type: 'RESET' };

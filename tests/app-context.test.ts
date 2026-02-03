import { describe, it, expect } from 'vitest';
import { AppState, AppAction, Theme, Analysis, FileMetadata, CSVData } from '@/lib/types';

// Reproduce the reducer logic for testing
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FILE':
      return {
        ...state,
        file: action.payload.file,
        csvData: action.payload.csvData,
        selectedColumn: null,
        analysis: null,
        analysisError: null,
      };

    case 'SET_SELECTED_COLUMN':
      return {
        ...state,
        selectedColumn: action.payload,
      };

    case 'START_ANALYSIS':
      return {
        ...state,
        isAnalyzing: true,
        analysisError: null,
      };

    case 'ANALYSIS_SUCCESS':
      return {
        ...state,
        analysis: action.payload,
        isAnalyzing: false,
        analysisError: null,
      };

    case 'ANALYSIS_ERROR':
      return {
        ...state,
        isAnalyzing: false,
        analysisError: action.payload,
      };

    case 'DELETE_THEME': {
      if (!state.analysis) return state;
      const themeToDelete = state.analysis.themes.find(t => t.id === action.payload);
      if (!themeToDelete) return state;
      const updatedThemes = state.analysis.themes.filter(t => t.id !== action.payload);
      const updatedUnassigned = [
        ...state.analysis.unassignedIndices,
        ...themeToDelete.responseIndices,
      ].sort((a, b) => a - b);
      return {
        ...state,
        analysis: {
          ...state.analysis,
          themes: updatedThemes,
          unassignedIndices: updatedUnassigned,
          assignedCount: state.analysis.totalResponses - updatedUnassigned.length,
          coveragePercentage: ((state.analysis.totalResponses - updatedUnassigned.length) / state.analysis.totalResponses) * 100,
        },
      };
    }

    case 'RESET':
      return {
        file: null,
        csvData: null,
        selectedColumn: null,
        analysis: null,
        isAnalyzing: false,
        analysisError: null,
        isExporting: false,
      };

    default:
      return state;
  }
}

describe('App Context Reducer', () => {
  const initialState: AppState = {
    file: null,
    csvData: null,
    selectedColumn: null,
    analysis: null,
    isAnalyzing: false,
    analysisError: null,
    isExporting: false,
  };

  const mockFile: FileMetadata = {
    id: 'file_1',
    filename: 'test.csv',
    size: 1024,
    uploadTime: new Date(),
    rowCount: 100,
    columnCount: 3,
    columns: ['id', 'response', 'date'],
    validationStatus: 'valid',
  };

  const mockCSVData: CSVData = {
    headers: ['id', 'response', 'date'],
    rows: [['1', 'Test response', '2024-01-01']],
    rowCount: 1,
  };

  const mockAnalysis: Analysis = {
    id: 'analysis_1',
    themes: [
      {
        id: 'theme_1',
        name: 'Test Theme',
        description: 'A test theme',
        responseIndices: [0],
        representativeQuotes: ['Test response'],
        count: 1,
        percentage: 100,
      },
    ],
    totalResponses: 1,
    assignedCount: 1,
    unassignedIndices: [],
    coveragePercentage: 100,
    processingTime: 1000,
    modelUsed: 'test-model',
    createdAt: new Date(),
  };

  describe('SET_FILE', () => {
    it('should set file and csvData', () => {
      const action: AppAction = {
        type: 'SET_FILE',
        payload: { file: mockFile, csvData: mockCSVData },
      };
      const newState = appReducer(initialState, action);

      expect(newState.file).toEqual(mockFile);
      expect(newState.csvData).toEqual(mockCSVData);
    });

    it('should clear previous analysis', () => {
      const stateWithAnalysis = { ...initialState, analysis: mockAnalysis };
      const action: AppAction = {
        type: 'SET_FILE',
        payload: { file: mockFile, csvData: mockCSVData },
      };
      const newState = appReducer(stateWithAnalysis, action);

      expect(newState.analysis).toBeNull();
      expect(newState.selectedColumn).toBeNull();
    });
  });

  describe('SET_SELECTED_COLUMN', () => {
    it('should set the selected column', () => {
      const action: AppAction = {
        type: 'SET_SELECTED_COLUMN',
        payload: 'response',
      };
      const newState = appReducer(initialState, action);

      expect(newState.selectedColumn).toBe('response');
    });
  });

  describe('START_ANALYSIS', () => {
    it('should set isAnalyzing to true', () => {
      const action: AppAction = { type: 'START_ANALYSIS' };
      const newState = appReducer(initialState, action);

      expect(newState.isAnalyzing).toBe(true);
      expect(newState.analysisError).toBeNull();
    });
  });

  describe('ANALYSIS_SUCCESS', () => {
    it('should set analysis and clear loading state', () => {
      const loadingState = { ...initialState, isAnalyzing: true };
      const action: AppAction = {
        type: 'ANALYSIS_SUCCESS',
        payload: mockAnalysis,
      };
      const newState = appReducer(loadingState, action);

      expect(newState.analysis).toEqual(mockAnalysis);
      expect(newState.isAnalyzing).toBe(false);
      expect(newState.analysisError).toBeNull();
    });
  });

  describe('ANALYSIS_ERROR', () => {
    it('should set error message and clear loading state', () => {
      const loadingState = { ...initialState, isAnalyzing: true };
      const action: AppAction = {
        type: 'ANALYSIS_ERROR',
        payload: 'Something went wrong',
      };
      const newState = appReducer(loadingState, action);

      expect(newState.analysisError).toBe('Something went wrong');
      expect(newState.isAnalyzing).toBe(false);
    });
  });

  describe('DELETE_THEME', () => {
    it('should remove theme and move responses to unassigned', () => {
      const stateWithAnalysis: AppState = {
        ...initialState,
        analysis: {
          ...mockAnalysis,
          themes: [
            { ...mockAnalysis.themes[0], responseIndices: [0, 1] },
            { id: 'theme_2', name: 'Theme 2', description: 'Another theme', responseIndices: [2], representativeQuotes: [], count: 1, percentage: 33.33 },
          ],
          totalResponses: 3,
          assignedCount: 3,
        },
      };

      const action: AppAction = { type: 'DELETE_THEME', payload: 'theme_1' };
      const newState = appReducer(stateWithAnalysis, action);

      expect(newState.analysis?.themes).toHaveLength(1);
      expect(newState.analysis?.themes[0].id).toBe('theme_2');
      expect(newState.analysis?.unassignedIndices).toContain(0);
      expect(newState.analysis?.unassignedIndices).toContain(1);
    });
  });

  describe('RESET', () => {
    it('should reset to initial state', () => {
      const populatedState: AppState = {
        file: mockFile,
        csvData: mockCSVData,
        selectedColumn: 'response',
        analysis: mockAnalysis,
        isAnalyzing: false,
        analysisError: null,
        isExporting: true,
      };

      const action: AppAction = { type: 'RESET' };
      const newState = appReducer(populatedState, action);

      expect(newState.file).toBeNull();
      expect(newState.csvData).toBeNull();
      expect(newState.selectedColumn).toBeNull();
      expect(newState.analysis).toBeNull();
      expect(newState.isExporting).toBe(false);
    });
  });
});

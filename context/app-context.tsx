"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, AppAction, Theme } from '@/lib/types';

const initialState: AppState = {
  file: null,
  csvData: null,
  selectedColumn: null,
  analysis: null,
  isAnalyzing: false,
  analysisError: null,
  isExporting: false,
  activeView: 'themes',
};

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

    case 'UPDATE_THEME': {
      if (!state.analysis) return state;

      const updatedThemes = state.analysis.themes.map((theme) =>
        theme.id === action.payload.themeId
          ? { ...theme, ...action.payload.updates }
          : theme
      );

      return {
        ...state,
        analysis: {
          ...state.analysis,
          themes: updatedThemes,
        },
      };
    }

    case 'DELETE_THEME': {
      if (!state.analysis) return state;

      const themeToDelete = state.analysis.themes.find(
        (t) => t.id === action.payload
      );

      if (!themeToDelete) return state;

      const updatedThemes = state.analysis.themes.filter(
        (t) => t.id !== action.payload
      );

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
          coveragePercentage:
            ((state.analysis.totalResponses - updatedUnassigned.length) /
              state.analysis.totalResponses) *
            100,
        },
      };
    }

    case 'MERGE_THEMES': {
      if (!state.analysis) return state;

      const sourceTheme = state.analysis.themes.find(
        (t) => t.id === action.payload.sourceId
      );
      const targetTheme = state.analysis.themes.find(
        (t) => t.id === action.payload.targetId
      );

      if (!sourceTheme || !targetTheme) return state;

      const mergedIndices = [
        ...new Set([
          ...targetTheme.responseIndices,
          ...sourceTheme.responseIndices,
        ]),
      ].sort((a, b) => a - b);

      const mergedQuotes = [
        ...new Set([
          ...targetTheme.representativeQuotes,
          ...sourceTheme.representativeQuotes,
        ]),
      ].slice(0, 5);

      const updatedThemes = state.analysis.themes
        .filter((t) => t.id !== action.payload.sourceId)
        .map((theme) =>
          theme.id === action.payload.targetId
            ? {
                ...theme,
                responseIndices: mergedIndices,
                representativeQuotes: mergedQuotes,
                count: mergedIndices.length,
                percentage:
                  (mergedIndices.length / state.analysis!.totalResponses) * 100,
              }
            : theme
        );

      return {
        ...state,
        analysis: {
          ...state.analysis,
          themes: updatedThemes,
        },
      };
    }

    case 'REASSIGN_RESPONSE': {
      if (!state.analysis) return state;

      const updatedThemes = state.analysis.themes.map((theme) => {
        const hasResponse = theme.responseIndices.includes(
          action.payload.responseIndex
        );

        if (hasResponse && theme.id !== action.payload.newThemeId) {
          // Remove from old theme
          const newIndices = theme.responseIndices.filter(
            (idx) => idx !== action.payload.responseIndex
          );
          return {
            ...theme,
            responseIndices: newIndices,
            count: newIndices.length,
            percentage: (newIndices.length / state.analysis!.totalResponses) * 100,
          };
        } else if (!hasResponse && theme.id === action.payload.newThemeId) {
          // Add to new theme
          const newIndices = [...theme.responseIndices, action.payload.responseIndex].sort(
            (a, b) => a - b
          );
          return {
            ...theme,
            responseIndices: newIndices,
            count: newIndices.length,
            percentage: (newIndices.length / state.analysis!.totalResponses) * 100,
          };
        }

        return theme;
      });

      // Remove from unassigned if applicable
      const updatedUnassigned = state.analysis.unassignedIndices.filter(
        (idx) => idx !== action.payload.responseIndex
      );

      return {
        ...state,
        analysis: {
          ...state.analysis,
          themes: updatedThemes,
          unassignedIndices: updatedUnassigned,
          assignedCount: state.analysis.totalResponses - updatedUnassigned.length,
          coveragePercentage:
            ((state.analysis.totalResponses - updatedUnassigned.length) /
              state.analysis.totalResponses) *
            100,
        },
      };
    }

    case 'ADD_THEME_TO_RESPONSE': {
      if (!state.analysis) return state;

      const { responseIndex, themeId } = action.payload;

      // If themeId is 'unassigned', remove from ALL themes
      if (themeId === 'unassigned') {
        const updatedThemes = state.analysis.themes.map((theme) => {
          if (theme.responseIndices.includes(responseIndex)) {
            const newIndices = theme.responseIndices.filter(idx => idx !== responseIndex);
            return {
              ...theme,
              responseIndices: newIndices,
              count: newIndices.length,
              percentage: (newIndices.length / state.analysis!.totalResponses) * 100,
            };
          }
          return theme;
        });

        // Add to unassigned if not already there
        const updatedUnassigned = state.analysis.unassignedIndices.includes(responseIndex)
          ? state.analysis.unassignedIndices
          : [...state.analysis.unassignedIndices, responseIndex].sort((a, b) => a - b);

        return {
          ...state,
          analysis: {
            ...state.analysis,
            themes: updatedThemes,
            unassignedIndices: updatedUnassigned,
            assignedCount: state.analysis.totalResponses - updatedUnassigned.length,
            coveragePercentage:
              ((state.analysis.totalResponses - updatedUnassigned.length) /
                state.analysis.totalResponses) *
              100,
          },
        };
      }

      // Add to target theme (without removing from other themes)
      const updatedThemes = state.analysis.themes.map((theme) => {
        if (theme.id === themeId && !theme.responseIndices.includes(responseIndex)) {
          const newIndices = [...theme.responseIndices, responseIndex].sort((a, b) => a - b);
          return {
            ...theme,
            responseIndices: newIndices,
            count: newIndices.length,
            percentage: (newIndices.length / state.analysis!.totalResponses) * 100,
          };
        }
        return theme;
      });

      // Remove from unassigned
      const updatedUnassigned = state.analysis.unassignedIndices.filter(
        idx => idx !== responseIndex
      );

      return {
        ...state,
        analysis: {
          ...state.analysis,
          themes: updatedThemes,
          unassignedIndices: updatedUnassigned,
          assignedCount: state.analysis.totalResponses - updatedUnassigned.length,
          coveragePercentage:
            ((state.analysis.totalResponses - updatedUnassigned.length) /
              state.analysis.totalResponses) *
            100,
        },
      };
    }

    case 'SPLIT_THEME': {
      if (!state.analysis) return state;

      const { sourceThemeId, newThemeName, newThemeDescription, responseIndicesToMove } = action.payload;

      const sourceTheme = state.analysis.themes.find(t => t.id === sourceThemeId);
      if (!sourceTheme) return state;

      // Validate: responses must belong to source theme
      const validIndices = responseIndicesToMove.filter(idx =>
        sourceTheme.responseIndices.includes(idx)
      );

      if (validIndices.length === 0) return state;

      // Create new theme
      const newTheme: Theme = {
        id: crypto.randomUUID(),
        name: newThemeName,
        description: newThemeDescription,
        responseIndices: validIndices.sort((a, b) => a - b),
        representativeQuotes: [],
        count: validIndices.length,
        percentage: (validIndices.length / state.analysis.totalResponses) * 100,
      };

      // Update source theme by removing moved responses
      const updatedSourceIndices = sourceTheme.responseIndices.filter(
        idx => !validIndices.includes(idx)
      );

      const updatedThemes = state.analysis.themes.map(theme =>
        theme.id === sourceThemeId
          ? {
              ...theme,
              responseIndices: updatedSourceIndices,
              count: updatedSourceIndices.length,
              percentage: (updatedSourceIndices.length / state.analysis!.totalResponses) * 100,
            }
          : theme
      );

      return {
        ...state,
        analysis: {
          ...state.analysis,
          themes: [...updatedThemes, newTheme],
        },
      };
    }

    case 'CREATE_THEME': {
      if (!state.analysis) return state;

      const newTheme: Theme = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        description: action.payload.description,
        responseIndices: [],
        representativeQuotes: [],
        count: 0,
        percentage: 0,
      };

      return {
        ...state,
        analysis: {
          ...state.analysis,
          themes: [...state.analysis.themes, newTheme],
        },
      };
    }

    case 'SET_ACTIVE_VIEW':
      return {
        ...state,
        activeView: action.payload,
      };

    case 'START_EXPORT':
      return {
        ...state,
        isExporting: true,
      };

    case 'FINISH_EXPORT':
      return {
        ...state,
        isExporting: false,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

const AppContext = createContext<
  | {
      state: AppState;
      dispatch: React.Dispatch<AppAction>;
    }
  | undefined
>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

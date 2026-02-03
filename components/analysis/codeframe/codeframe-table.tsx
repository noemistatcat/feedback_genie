"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import CodeframeRow from './codeframe-row';

interface ResponseWithIndex {
  response: string;
  originalIndex: number;
}

interface CodeframeTableProps {
  responsesWithIndices: ResponseWithIndex[];
  searchQuery: string;
}

type SortField = 'index' | 'response' | 'theme';
type SortDirection = 'asc' | 'desc';

export default function CodeframeTable({ responsesWithIndices, searchQuery }: CodeframeTableProps) {
  const { state } = useAppContext();
  const [sortField, setSortField] = useState<SortField>('index');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get all theme assignments for each response (supports multi-theme)
  const getThemesForResponse = (responseIndex: number) => {
    if (!state.analysis) return [];

    return state.analysis.themes.filter(t =>
      t.responseIndices.includes(responseIndex)
    );
  };

  // Filter and sort responses
  const processedResponses = useMemo(() => {
    const filtered = responsesWithIndices
      .map((item) => ({
        index: item.originalIndex,
        response: item.response,
        themes: getThemesForResponse(item.originalIndex),
      }))
      .filter(item =>
        searchQuery === '' ||
        item.response.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.themes.some(theme => theme.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'index':
          comparison = a.index - b.index;
          break;
        case 'response':
          comparison = a.response.localeCompare(b.response);
          break;
        case 'theme':
          const aTheme = a.themes[0]?.name || 'Unassigned';
          const bTheme = b.themes[0]?.name || 'Unassigned';
          comparison = aTheme.localeCompare(bTheme);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [responsesWithIndices, searchQuery, sortField, sortDirection, state.analysis?.themes]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <input type="checkbox" className="rounded" />
              </th>
              <th
                className="w-20 px-4 py-3 text-left text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('index')}
              >
                Row #
                <SortIcon field="index" />
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('response')}
              >
                Response
                <SortIcon field="response" />
              </th>
              <th
                className="w-48 px-4 py-3 text-left text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('theme')}
              >
                Theme
                <SortIcon field="theme" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {processedResponses.map((item) => (
              <CodeframeRow
                key={item.index}
                responseIndex={item.index}
                responseText={item.response}
                themes={item.themes}
                allThemes={state.analysis?.themes || []}
              />
            ))}
          </tbody>
        </table>
      </div>

      {processedResponses.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No responses found matching your search
        </div>
      )}

      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
        Showing {processedResponses.length} of {responsesWithIndices.length} responses
      </div>
    </div>
  );
}

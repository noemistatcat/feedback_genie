"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import CodeframeTable from './codeframe-table';
import ThemeSidebar from './theme-sidebar';
import { Search } from 'lucide-react';

export default function CodeframeView() {
  const { state } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  if (!state.analysis || !state.csvData || !state.selectedColumn) {
    return (
      <div className="text-center text-slate-500 py-12">
        No analysis data available
      </div>
    );
  }

  const columnIndex = state.csvData.headers.indexOf(state.selectedColumn);
  if (columnIndex === -1) {
    return (
      <div className="text-center text-slate-500 py-12">
        Selected column not found
      </div>
    );
  }

  // Get all non-blank responses with their original indices
  // Blank responses are excluded from analysis
  const responsesWithIndices = state.csvData.rows
    .map((row, index) => ({
      response: row[columnIndex] || '',
      originalIndex: index,
    }))
    .filter((item) => item.response && item.response.trim() !== '');

  return (
    <div className="flex gap-4">
      {/* Main table area */}
      <div className="flex-1">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <CodeframeTable responsesWithIndices={responsesWithIndices} searchQuery={searchQuery} />
      </div>

      {/* Sidebar with theme drop zones */}
      <ThemeSidebar />
    </div>
  );
}

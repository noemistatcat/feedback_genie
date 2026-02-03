"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { X, Split } from 'lucide-react';
import { Theme } from '@/lib/types';

interface SplitDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SplitDialog({ isOpen, onClose }: SplitDialogProps) {
  const { state, dispatch } = useAppContext();
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDescription, setNewThemeDescription] = useState('');

  if (!isOpen || !state.analysis || !state.csvData || !state.selectedColumn) {
    return null;
  }

  const selectedTheme = state.analysis.themes.find(t => t.id === selectedThemeId);
  const columnIndex = state.csvData.headers.indexOf(state.selectedColumn);

  const handleToggleResponse = (index: number) => {
    setSelectedIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSplit = () => {
    if (!selectedThemeId || selectedIndices.length === 0 || !newThemeName) {
      alert('Please select a theme, responses to move, and enter a new theme name');
      return;
    }

    dispatch({
      type: 'SPLIT_THEME',
      payload: {
        sourceThemeId: selectedThemeId,
        newThemeName,
        newThemeDescription,
        responseIndicesToMove: selectedIndices,
      },
    });

    // Reset and close
    setSelectedThemeId('');
    setSelectedIndices([]);
    setNewThemeName('');
    setNewThemeDescription('');
    onClose();
  };

  const handleClose = () => {
    setSelectedThemeId('');
    setSelectedIndices([]);
    setNewThemeName('');
    setNewThemeDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Split className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-900">Split Theme</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Select source theme */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select theme to split
            </label>
            <select
              value={selectedThemeId}
              onChange={(e) => {
                setSelectedThemeId(e.target.value);
                setSelectedIndices([]);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a theme...</option>
              {state.analysis.themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name} ({theme.count} responses)
                </option>
              ))}
            </select>
          </div>

          {/* Select responses */}
          {selectedTheme && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select responses to move ({selectedIndices.length} selected)
              </label>
              <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                {selectedTheme.responseIndices.map((responseIndex) => {
                  const responseText = state.csvData!.rows[responseIndex]?.[columnIndex] || '';
                  return (
                    <label
                      key={responseIndex}
                      className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIndices.includes(responseIndex)}
                        onChange={() => handleToggleResponse(responseIndex)}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-xs text-slate-500 mb-1">
                          Response #{responseIndex + 1}
                        </div>
                        <div className="text-sm text-slate-900">
                          {responseText}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* New theme details */}
          {selectedIndices.length > 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New theme name *
                </label>
                <input
                  type="text"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="Enter theme name..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New theme description
                </label>
                <textarea
                  value={newThemeDescription}
                  onChange={(e) => setNewThemeDescription(e.target.value)}
                  placeholder="Enter theme description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSplit}
            disabled={!selectedThemeId || selectedIndices.length === 0 || !newThemeName}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Split Theme
          </button>
        </div>
      </div>
    </div>
  );
}

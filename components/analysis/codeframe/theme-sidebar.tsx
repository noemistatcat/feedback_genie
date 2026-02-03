"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Plus, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThemeColor } from '@/lib/theme-colors';
import { Button } from '@/components/ui/button';

export default function ThemeSidebar() {
  const { state, dispatch } = useAppContext();
  const [dragOverThemeId, setDragOverThemeId] = useState<string | null>(null);

  if (!state.analysis) return null;

  const handleDragOver = (e: React.DragEvent, themeId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverThemeId(themeId);
  };

  const handleDragLeave = () => {
    setDragOverThemeId(null);
  };

  const handleDrop = (e: React.DragEvent, themeId: string) => {
    e.preventDefault();
    const responseIndex = parseInt(e.dataTransfer.getData('responseIndex'));

    if (!isNaN(responseIndex)) {
      dispatch({
        type: 'ADD_THEME_TO_RESPONSE',
        payload: { responseIndex, themeId },
      });
    }

    setDragOverThemeId(null);
  };

  const handleCreateTheme = () => {
    const name = prompt('Enter theme name:');
    if (!name) return;

    const description = prompt('Enter theme description:') || '';

    dispatch({
      type: 'CREATE_THEME',
      payload: { name, description },
    });
  };

  return (
    <div className="w-64 flex-shrink-0">
      <div className="sticky top-4 bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Themes</h3>
        <p className="text-xs text-slate-500 mb-3">
          Drag rows to themes to assign. Responses can belong to multiple themes.
        </p>

        <div className="space-y-2">
          {state.analysis.themes.map((theme, index) => {
            const color = getThemeColor(index);
            return (
              <div
                key={theme.id}
                onDragOver={(e) => handleDragOver(e, theme.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, theme.id)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border-2 transition-colors cursor-pointer',
                  dragOverThemeId === theme.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <Circle className={cn('w-3 h-3 flex-shrink-0', color.color, color.fill)} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {theme.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {theme.count} {theme.count === 1 ? 'response' : 'responses'}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Unassigned drop zone */}
          <div
            onDragOver={(e) => handleDragOver(e, 'unassigned')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'unassigned')}
            className={cn(
              'flex items-center gap-2 p-3 rounded-lg border-2 transition-colors cursor-pointer',
              dragOverThemeId === 'unassigned'
                ? 'border-slate-500 bg-slate-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <Circle className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-600 truncate">
                Unassigned
              </div>
              <div className="text-xs text-slate-500">
                {state.analysis.unassignedIndices.length}{' '}
                {state.analysis.unassignedIndices.length === 1 ? 'response' : 'responses'}
              </div>
            </div>
          </div>
        </div>

        {/* Create new theme button */}
        <Button
          onClick={handleCreateTheme}
          className="mt-4 w-full"
          size="default"
        >
          <Plus className="w-4 h-4" />
          New Theme
        </Button>
      </div>
    </div>
  );
}

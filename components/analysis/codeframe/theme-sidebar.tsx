"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Plus, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThemeColor } from '@/lib/theme-colors';
import { Button } from '@/components/ui/button';

export default function ThemeSidebar() {
  const { state, dispatch } = useAppContext();
  const [dragOverSidebar, setDragOverSidebar] = useState(false);
  const [draggingThemeId, setDraggingThemeId] = useState<string | null>(null);

  if (!state.analysis) return null;

  const handleThemeDragStart = (e: React.DragEvent, themeId: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', themeId); // Standard MIME type
    e.dataTransfer.setData('application/theme-id', themeId); // Custom identifier
    setDraggingThemeId(themeId);
  };

  const handleThemeDragEnd = () => {
    setDraggingThemeId(null);
  };

  // Sidebar becomes drop zone for removing badges
  const handleSidebarDragOver = (e: React.DragEvent) => {
    // Check if we're dragging a badge (has both themeId and responseIndex)
    const types = e.dataTransfer.types;
    if (types.includes('application/badge-remove')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverSidebar(true);
    }
  };

  const handleSidebarDragLeave = () => {
    setDragOverSidebar(false);
  };

  const handleSidebarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const themeId = e.dataTransfer.getData('application/badge-theme-id');
    const responseIndex = parseInt(e.dataTransfer.getData('application/badge-response-index'));

    if (themeId && !isNaN(responseIndex)) {
      dispatch({
        type: 'REMOVE_THEME_FROM_RESPONSE',
        payload: { responseIndex, themeId },
      });
    }

    setDragOverSidebar(false);
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
      <div
        className={cn(
          'sticky top-4 bg-white border-2 rounded-lg p-4 transition-colors',
          dragOverSidebar
            ? 'border-red-400 bg-red-50'
            : 'border-slate-200'
        )}
        onDragOver={handleSidebarDragOver}
        onDragLeave={handleSidebarDragLeave}
        onDrop={handleSidebarDrop}
      >
        <h3 className="font-semibold text-slate-900 mb-3">Themes</h3>
        <p className="text-xs text-slate-500 mb-3">
          Drag themes to rows to assign. Drag badges here to remove.
        </p>

        <div className="space-y-2">
          {state.analysis.themes.map((theme, index) => {
            const color = getThemeColor(index);
            return (
              <div
                key={theme.id}
                draggable
                onDragStart={(e) => handleThemeDragStart(e, theme.id)}
                onDragEnd={handleThemeDragEnd}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border-2 transition-colors cursor-move',
                  draggingThemeId === theme.id
                    ? 'opacity-50 border-slate-300'
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

          {/* Unassigned (informational only) */}
          <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 bg-slate-50">
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

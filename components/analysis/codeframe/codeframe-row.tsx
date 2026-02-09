"use client";

import React, { useState } from 'react';
import { Theme } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getThemeColorById } from '@/lib/theme-colors';
import { useAppContext } from '@/context/app-context';

interface CodeframeRowProps {
  responseIndex: number;
  responseText: string;
  themes: Theme[];
  allThemes: Theme[];
}

export default function CodeframeRow({ responseIndex, responseText, themes, allThemes }: CodeframeRowProps) {
  const { dispatch } = useAppContext();
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingBadge, setDraggingBadge] = useState<string | null>(null);

  // Row becomes drop target for themes
  const handleRowDragOver = (e: React.DragEvent) => {
    // Check if we're dragging a theme (not a badge)
    const types = e.dataTransfer.types;
    if (types.includes('application/theme-id')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  };

  const handleRowDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const themeId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/theme-id');

    if (themeId) {
      dispatch({
        type: 'ADD_THEME_TO_RESPONSE',
        payload: { responseIndex, themeId },
      });
    }

    setIsDragOver(false);
  };

  // Theme badges become draggable
  const handleBadgeDragStart = (e: React.DragEvent, themeId: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/badge-remove', 'true'); // Marker for badge drag
    e.dataTransfer.setData('application/badge-theme-id', themeId);
    e.dataTransfer.setData('application/badge-response-index', String(responseIndex));
    setDraggingBadge(themeId);
  };

  const handleBadgeDragEnd = () => {
    setDraggingBadge(null);
  };

  return (
    <tr
      onDragOver={handleRowDragOver}
      onDragLeave={handleRowDragLeave}
      onDrop={handleRowDrop}
      className={cn(
        'hover:bg-slate-50 transition-colors',
        isDragOver && 'bg-blue-50 ring-2 ring-inset ring-blue-400'
      )}
    >
      <td className="px-4 py-3">
        <input type="checkbox" className="rounded" />
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {responseIndex + 1}
      </td>
      <td className="px-4 py-3 text-sm text-slate-900">
        <div className="line-clamp-2">{responseText}</div>
      </td>
      <td className="px-4 py-3">
        {themes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {themes.map((theme) => {
              const color = getThemeColorById(allThemes, theme.id);
              return (
                <span
                  key={theme.id}
                  draggable
                  onDragStart={(e) => handleBadgeDragStart(e, theme.id)}
                  onDragEnd={handleBadgeDragEnd}
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-move transition-opacity',
                    color.bg,
                    color.text,
                    draggingBadge === theme.id && 'opacity-50'
                  )}
                >
                  {theme.name}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            Unassigned
          </span>
        )}
      </td>
    </tr>
  );
}

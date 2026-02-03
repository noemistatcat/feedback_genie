"use client";

import React, { useState } from 'react';
import { Theme } from '@/lib/types';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThemeColorById } from '@/lib/theme-colors';

interface CodeframeRowProps {
  responseIndex: number;
  responseText: string;
  themes: Theme[];
  allThemes: Theme[];
}

export default function CodeframeRow({ responseIndex, responseText, themes, allThemes }: CodeframeRowProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('responseIndex', String(responseIndex));
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <tr
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'hover:bg-slate-50 transition-colors cursor-move',
        isDragging && 'opacity-50'
      )}
    >
      <td className="px-4 py-3">
        <input type="checkbox" className="rounded" />
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-400" />
          {responseIndex + 1}
        </div>
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
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    color.bg,
                    color.text
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

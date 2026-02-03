"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Theme } from "@/lib/types";
import { useAppContext } from "@/context/app-context";

interface ThemeCardProps {
  theme: Theme;
  onEdit: (theme: Theme) => void;
  onDelete: (themeId: string) => void;
}

export function ThemeCard({ theme, onEdit, onDelete }: ThemeCardProps) {
  const { state } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const responses = theme.responseIndices.map((idx) => {
    if (!state.csvData) return "";
    const columnIndex = state.csvData.headers.indexOf(state.selectedColumn!);
    return state.csvData.rows[idx]?.[columnIndex] || "";
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{theme.name}</CardTitle>
              <Badge variant="secondary">
                {theme.count} ({theme.percentage.toFixed(1)}%)
              </Badge>
              {theme.confidence && (
                <Badge variant="outline">
                  {(theme.confidence * 100).toFixed(0)}% confidence
                </Badge>
              )}
            </div>
            <CardDescription>{theme.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(theme)}
              title="Edit theme"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(theme.id)}
              title="Delete theme"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 text-slate-700">
              Representative Quotes
            </h4>
            <ul className="space-y-2">
              {theme.representativeQuotes.slice(0, 3).map((quote, idx) => (
                <li
                  key={idx}
                  className="text-sm text-slate-600 pl-4 border-l-2 border-slate-300 italic"
                >
                  "{quote}"
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide all responses
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show all {theme.count} responses
                </>
              )}
            </Button>

            {isExpanded && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {responses.map((response, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded border border-slate-200 text-sm"
                  >
                    <div className="text-xs text-slate-500 mb-1">
                      Response #{theme.responseIndices[idx]}
                    </div>
                    <div className="text-slate-700">{response}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

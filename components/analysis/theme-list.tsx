"use client";

import { useState } from "react";
import { Merge, AlertCircle, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/context/app-context";
import { ThemeCard } from "./theme-card";
import { ThemeEditor } from "./theme-editor";
import { MergeDialog } from "./merge-dialog";
import SplitDialog from "./split-dialog";
import { Theme } from "@/lib/types";

export function ThemeList() {
  const { state, dispatch } = useAppContext();
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);

  if (!state.analysis) return null;

  const handleDelete = (themeId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this theme? Its responses will be moved to unassigned."
      )
    ) {
      dispatch({
        type: "DELETE_THEME",
        payload: themeId,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                {state.analysis.themes.length} themes identified •{" "}
                {state.analysis.coveragePercentage.toFixed(1)}% coverage •{" "}
                Processed in {(state.analysis.processingTime / 1000).toFixed(1)}s
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMergeDialog(true)}
                disabled={state.analysis.themes.length < 2}
              >
                <Merge className="w-4 h-4 mr-2" />
                Merge Themes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSplitDialog(true)}
                disabled={state.analysis.themes.length === 0}
              >
                <Split className="w-4 h-4 mr-2" />
                Split Theme
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {state.analysis.unassignedIndices.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {state.analysis.unassignedIndices.length} responses unassigned
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Some responses were not assigned to any theme. Consider
                  reviewing them manually.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {state.analysis.themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            onEdit={setEditingTheme}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <ThemeEditor
        theme={editingTheme}
        open={editingTheme !== null}
        onClose={() => setEditingTheme(null)}
      />

      <MergeDialog
        open={showMergeDialog}
        onClose={() => setShowMergeDialog(false)}
      />

      <SplitDialog
        isOpen={showSplitDialog}
        onClose={() => setShowSplitDialog(false)}
      />
    </>
  );
}

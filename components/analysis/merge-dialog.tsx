"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Theme } from "@/lib/types";
import { useAppContext } from "@/context/app-context";
import { AlertCircle } from "lucide-react";

interface MergeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function MergeDialog({ open, onClose }: MergeDialogProps) {
  const { state, dispatch } = useAppContext();
  const [sourceThemeId, setSourceThemeId] = useState("");
  const [targetThemeId, setTargetThemeId] = useState("");

  const handleMerge = () => {
    if (!sourceThemeId || !targetThemeId || sourceThemeId === targetThemeId) {
      return;
    }

    dispatch({
      type: "MERGE_THEMES",
      payload: {
        sourceId: sourceThemeId,
        targetId: targetThemeId,
      },
    });

    setSourceThemeId("");
    setTargetThemeId("");
    onClose();
  };

  const handleCancel = () => {
    setSourceThemeId("");
    setTargetThemeId("");
    onClose();
  };

  const themes = state.analysis?.themes || [];
  const canMerge =
    sourceThemeId &&
    targetThemeId &&
    sourceThemeId !== targetThemeId &&
    themes.length >= 2;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle>Merge Themes</DialogTitle>
        <DialogDescription>
          Combine two similar themes into one. The source theme will be merged
          into the target theme and then deleted.
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Source Theme (will be deleted)
            </label>
            <Select
              value={sourceThemeId}
              onChange={(e) => setSourceThemeId(e.target.value)}
            >
              <option value="">Select a theme...</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name} ({theme.count} responses)
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Target Theme (will receive merged responses)
            </label>
            <Select
              value={targetThemeId}
              onChange={(e) => setTargetThemeId(e.target.value)}
            >
              <option value="">Select a theme...</option>
              {themes
                .filter((t) => t.id !== sourceThemeId)
                .map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name} ({theme.count} responses)
                  </option>
                ))}
            </Select>
          </div>

          {sourceThemeId === targetThemeId && sourceThemeId && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Source and target themes must be different
              </p>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleMerge} disabled={!canMerge}>
          Merge Themes
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

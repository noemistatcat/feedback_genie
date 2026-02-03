"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Theme } from "@/lib/types";
import { useAppContext } from "@/context/app-context";

interface ThemeEditorProps {
  theme: Theme | null;
  open: boolean;
  onClose: () => void;
}

export function ThemeEditor({ theme, open, onClose }: ThemeEditorProps) {
  const { dispatch } = useAppContext();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (theme) {
      setName(theme.name);
      setDescription(theme.description);
    }
  }, [theme]);

  const handleSave = () => {
    if (!theme) return;

    dispatch({
      type: "UPDATE_THEME",
      payload: {
        themeId: theme.id,
        updates: {
          name: name.trim(),
          description: description.trim(),
        },
      },
    });

    onClose();
  };

  const handleCancel = () => {
    if (theme) {
      setName(theme.name);
      setDescription(theme.description);
    }
    onClose();
  };

  if (!theme) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle>Edit Theme</DialogTitle>
        <DialogDescription>
          Update the theme name and description to better reflect the responses
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Theme Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a concise theme name (2-5 words)"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this theme represents (1-2 sentences)"
              rows={4}
              maxLength={500}
            />
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!name.trim() || !description.trim()}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

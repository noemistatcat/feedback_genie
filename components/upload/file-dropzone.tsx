"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/context/app-context";
import { useLog } from "@/context/log-context";
import { parseCSVFile } from "@/lib/csv/parser";

export function FileDropzone() {
  const { dispatch } = useAppContext();
  const { addLog } = useLog();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);

      addLog('info', `Uploading file: ${file.name}`, `Size: ${(file.size / 1024).toFixed(1)} KB`);

      try {
        addLog('info', 'Parsing CSV file...');
        const result = await parseCSVFile(file);

        if (!result.isValid) {
          addLog('error', 'File validation failed', result.errors.join('\n'));
          setError(result.errors.join(". "));
          setIsUploading(false);
          return;
        }

        if (result.data && result.metadata) {
          addLog('success', `File loaded successfully`, `Rows: ${result.metadata.rowCount}, Columns: ${result.metadata.columnCount}\nColumns: ${result.metadata.columns.join(', ')}`);
          dispatch({
            type: "SET_FILE",
            payload: {
              file: result.metadata,
              csvData: result.data,
            },
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to process file";
        addLog('error', 'File processing error', errorMsg);
        setError(errorMsg);
      } finally {
        setIsUploading(false);
      }
    },
    [dispatch, addLog]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  return (
    <Card className={isDragging ? "border-primary border-2" : ""}>
      <CardContent className="p-8">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center
            transition-colors cursor-pointer
            ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-slate-300 hover:border-slate-400"
            }
          `}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              {isUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              ) : (
                <Upload className="w-8 h-8 text-blue-600" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-1">Upload CSV File</h3>
              <p className="text-sm text-slate-600 mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={onFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold shadow-sm transition-all h-10 px-4 py-2 cursor-pointer ${
                isUploading
                  ? "opacity-50 pointer-events-none bg-primary text-primary-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md"
              }`}
            >
              <FileText className="w-4 h-4" />
              Choose File
            </label>

            <p className="text-xs text-slate-500 mt-2">
              CSV files only • 10-10,000 responses • Max 10MB
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Upload Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

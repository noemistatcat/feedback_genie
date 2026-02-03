"use client";

import { useState } from "react";
import { Download, FileText, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/context/app-context";
import {
  generateCSVExport,
  generateJSONExport,
  downloadFile,
} from "@/lib/csv/exporter";

export function ExportPanel() {
  const { state, dispatch } = useAppContext();
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  if (!state.analysis || !state.csvData || !state.selectedColumn) return null;

  const handleExport = () => {
    if (!state.analysis || !state.csvData || !state.selectedColumn) return;

    dispatch({ type: "START_EXPORT" });

    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const baseFilename = `theme-analysis-${timestamp}`;

      if (exportFormat === "csv") {
        const csvContent = generateCSVExport(
          state.analysis,
          state.csvData,
          state.selectedColumn
        );
        downloadFile(csvContent, `${baseFilename}.csv`, "text/csv");
      } else {
        const jsonContent = generateJSONExport(
          state.analysis,
          state.csvData,
          state.selectedColumn
        );
        downloadFile(
          jsonContent,
          `${baseFilename}.json`,
          "application/json"
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export results. Please try again.");
    } finally {
      dispatch({ type: "FINISH_EXPORT" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Results</CardTitle>
        <CardDescription>
          Download your analysis in a structured format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat("csv")}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${
                    exportFormat === "csv"
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-slate-300"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <FileText
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      exportFormat === "csv"
                        ? "text-primary"
                        : "text-slate-400"
                    }`}
                  />
                  <div>
                    <div
                      className={`font-medium ${
                        exportFormat === "csv"
                          ? "text-primary"
                          : "text-slate-900"
                      }`}
                    >
                      CSV
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Spreadsheet format with response-to-theme mappings
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setExportFormat("json")}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${
                    exportFormat === "json"
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-slate-300"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <FileJson
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      exportFormat === "json"
                        ? "text-primary"
                        : "text-slate-400"
                    }`}
                  />
                  <div>
                    <div
                      className={`font-medium ${
                        exportFormat === "json"
                          ? "text-primary"
                          : "text-slate-900"
                      }`}
                    >
                      JSON
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Complete structured data for programmatic use
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={state.isExporting}
            size="lg"
            className="w-full"
          >
            <Download className="w-5 h-5 mr-2" />
            {state.isExporting
              ? "Exporting..."
              : `Download ${exportFormat.toUpperCase()}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

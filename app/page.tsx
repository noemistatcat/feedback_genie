"use client";

import { RotateCcw } from "lucide-react";
import { useAppContext } from "@/context/app-context";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { DataPreview } from "@/components/upload/data-preview";
import { AnalysisLauncher } from "@/components/analysis/analysis-launcher";
import AnalysisViewTabs from "@/components/analysis/analysis-view-tabs";
import { ExportPanel } from "@/components/export/export-panel";
import { LogPanel } from "@/components/ui/log-panel";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { state, dispatch } = useAppContext();

  const handleReset = () => {
    if (confirm("Start over? This will clear your current analysis.")) {
      dispatch({ type: "RESET" });
    }
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 pb-20">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                  Feedback Genie
                </h1>
                <p className="text-slate-600 font-medium">
                  AI-powered analysis of open-ended survey responses
                </p>
              </div>
              {state.file && (
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </Button>
              )}
            </div>
          </header>

          <div className="space-y-6">
            {/* Upload section */}
            {!state.file && <FileDropzone />}

            {/* Preview section */}
            {state.file && !state.analysis && (
              <>
                <DataPreview />
                <AnalysisLauncher />
              </>
            )}

            {/* Analysis results */}
            {state.analysis && (
              <>
                <AnalysisViewTabs />
                <ExportPanel />
              </>
            )}
          </div>
        </div>
      </main>
      <LogPanel />
    </>
  );
}

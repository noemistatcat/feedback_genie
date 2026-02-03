"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/context/app-context";
import { useLog } from "@/context/log-context";
import { Analysis } from "@/lib/types";

export function AnalysisLauncher() {
  const { state, dispatch } = useAppContext();
  const { addLog } = useLog();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  const canAnalyze = state.file && state.csvData && state.selectedColumn && !state.isAnalyzing;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    dispatch({ type: "START_ANALYSIS" });

    try {
      // Extract responses from the selected column
      const columnIndex = state.csvData!.headers.indexOf(state.selectedColumn!);

      // Filter out blank/empty responses while maintaining original indices
      const filteredData = state.csvData!.rows
        .map((row, originalIndex) => ({
          response: row[columnIndex],
          originalIndex,
        }))
        .filter((item) => item.response && item.response.trim() !== "");

      const responses = filteredData.map((item) => item.response);
      const indexMap = filteredData.map((item) => item.originalIndex);

      addLog('info', `Starting AI analysis`, `Column: "${state.selectedColumn}"\nResponses to analyze: ${responses.length}\nModel: gemini-3-flash-preview`);

      // Call the API
      addLog('info', 'Sending request to AI service...');
      const startTime = Date.now();

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responses,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const analysisFromApi: Analysis = await response.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      // Remap filtered indices back to original CSV row indices
      const analysis: Analysis = {
        ...analysisFromApi,
        themes: analysisFromApi.themes.map((theme) => ({
          ...theme,
          responseIndices: theme.responseIndices.map((filteredIdx) => indexMap[filteredIdx]),
        })),
        unassignedIndices: analysisFromApi.unassignedIndices.map((filteredIdx) => indexMap[filteredIdx]),
        totalResponses: state.csvData!.rows.length,
        assignedCount: analysisFromApi.assignedCount,
        coveragePercentage: (analysisFromApi.assignedCount / state.csvData!.rows.length) * 100,
      };

      addLog('success', `Analysis complete in ${duration}s`, `Themes found: ${analysis.themes.length}\nCoverage: ${analysis.coveragePercentage.toFixed(1)}%\nThemes: ${analysis.themes.map(t => t.name).join(', ')}`);

      dispatch({
        type: "ANALYSIS_SUCCESS",
        payload: analysis,
      });

      setRetryCount(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Retry logic for transient failures
      if (retryCount < MAX_RETRIES && !errorMessage.includes("configuration")) {
        addLog('warning', `Analysis failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`, errorMessage);
        setRetryCount(retryCount + 1);
        setTimeout(() => handleAnalyze(), 1000);
        return;
      }

      addLog('error', 'Analysis failed', errorMessage);
      dispatch({
        type: "ANALYSIS_ERROR",
        payload: errorMessage,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Analysis</CardTitle>
        <CardDescription>
          AI will analyze responses and identify themes (blank rows are excluded)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            size="lg"
            className="w-full"
          >
            {state.isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
                {retryCount > 0 && ` (Retry ${retryCount}/${MAX_RETRIES})`}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Responses
              </>
            )}
          </Button>

          {!state.selectedColumn && (
            <p className="text-sm text-amber-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Please select a column above before analyzing
            </p>
          )}

          {state.analysisError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Analysis Failed</p>
                  <p className="text-sm text-red-700 mt-1">{state.analysisError}</p>
                  <Button
                    onClick={handleAnalyze}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state.isAnalyzing && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                This may take 15-60 seconds depending on dataset size. Please wait...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

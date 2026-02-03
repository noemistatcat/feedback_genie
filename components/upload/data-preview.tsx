"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useAppContext } from "@/context/app-context";
import { useLog } from "@/context/log-context";

export function DataPreview() {
  const { state, dispatch } = useAppContext();
  const { addLog } = useLog();

  if (!state.csvData || !state.file) return null;

  const previewRows = state.csvData.rows.slice(0, 10);

  const handleColumnSelect = (column: string) => {
    if (column) {
      addLog('info', `Selected column: "${column}"`);
    }
    dispatch({
      type: "SET_SELECTED_COLUMN",
      payload: column,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Preview</CardTitle>
        <CardDescription>
          {state.file.filename} • {state.file.rowCount} responses •{" "}
          {state.file.columnCount} columns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select the column containing responses
            </label>
            <Select
              value={state.selectedColumn || ""}
              onChange={(e) => handleColumnSelect(e.target.value)}
            >
              <option value="">Choose a column...</option>
              {state.csvData.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {state.csvData.headers.map((header, idx) => (
                      <th
                        key={idx}
                        className={`px-4 py-3 text-left font-medium text-slate-700 ${
                          header === state.selectedColumn
                            ? "bg-blue-50 text-blue-700"
                            : ""
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b last:border-b-0">
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className={`px-4 py-3 text-slate-600 ${
                            state.csvData!.headers[cellIdx] ===
                            state.selectedColumn
                              ? "bg-blue-50/50"
                              : ""
                          }`}
                        >
                          <div className="max-w-xs truncate" title={cell}>
                            {cell || "(empty)"}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {previewRows.length < state.csvData.rowCount && (
            <p className="text-xs text-slate-500 text-center">
              Showing first {previewRows.length} of {state.csvData.rowCount}{" "}
              rows
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

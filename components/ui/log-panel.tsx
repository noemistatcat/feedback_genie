"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Trash2, Terminal } from "lucide-react";
import { useLog, LogEntry, LogLevel } from "@/context/log-context";
import { Button } from "@/components/ui/button";

const levelColors: Record<LogLevel, string> = {
  info: "text-blue-600",
  success: "text-green-600",
  warning: "text-amber-600",
  error: "text-red-600",
};

const levelBg: Record<LogLevel, string> = {
  info: "bg-blue-50",
  success: "bg-green-50",
  warning: "bg-amber-50",
  error: "bg-red-50",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LogEntryRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border-b border-slate-100 last:border-b-0 ${levelBg[entry.level]}`}>
      <div
        className="px-3 py-2 flex items-start gap-2 cursor-pointer hover:bg-slate-50/50"
        onClick={() => entry.details && setExpanded(!expanded)}
      >
        <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
          {formatTime(entry.timestamp)}
        </span>
        <span className={`text-xs font-semibold uppercase w-14 ${levelColors[entry.level]}`}>
          [{entry.level}]
        </span>
        <span className="text-sm text-slate-700 flex-1">{entry.message}</span>
        {entry.details && (
          <span className="text-slate-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
      </div>
      {expanded && entry.details && (
        <div className="px-3 pb-2 pl-24">
          <pre className="text-xs text-slate-600 bg-slate-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
            {entry.details}
          </pre>
        </div>
      )}
    </div>
  );
}

export function LogPanel() {
  const { logs, clearLogs } = useLog();
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  // Auto-open when there's activity
  useEffect(() => {
    if (logs.length > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [logs.length]);

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warningCount = logs.filter((l) => l.level === "warning").length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Header bar - always visible */}
      <div
        className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4" />
          <span className="text-sm font-medium">Activity Log</span>
          <span className="text-xs text-slate-400">({logs.length} entries)</span>
          {errorCount > 0 && (
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
              {errorCount} error{errorCount > 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {warningCount} warning{warningCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-slate-600 h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                clearLogs();
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
          {isOpen ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </div>
      </div>

      {/* Log content - collapsible */}
      {isOpen && (
        <div
          ref={scrollRef}
          className="bg-white border-t border-slate-200 max-h-64 overflow-y-auto shadow-lg"
        >
          {logs.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              No activity yet. Upload a file to get started.
            </div>
          ) : (
            logs.map((entry) => <LogEntryRow key={entry.id} entry={entry} />)
          )}
        </div>
      )}
    </div>
  );
}

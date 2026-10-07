"use client";

import { useMemo, useSyncExternalStore } from "react";

export type PocId = "predict-vs-read" | "input-methods" | "crowd";

export type LogEntry = {
  id: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  poc: PocId;
  seriesId: string;
  condition: string;
  timeToAnswerMs: number | null;
  revealMs: number | null;
  recallPrompt: string;
  recallAnswer: string;
  recallTimeMs: number | null;
  guessJson: string;
  viewportWidth: number | null;
};

const LOG_KEY = "plotcall.logs.v1";
const SESSION_KEY = "plotcall.session.v1";
const EVENT = "plotcall-changed";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

function readLogsRaw(): string {
  try {
    return localStorage.getItem(LOG_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function readSessionRaw(): string {
  try {
    return localStorage.getItem(SESSION_KEY) ?? "";
  } catch {
    return "";
  }
}

function isLogEntry(value: unknown): value is LogEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<LogEntry>;
  return typeof entry.id === "string" && typeof entry.poc === "string";
}

export function useLogs(): LogEntry[] {
  const raw = useSyncExternalStore(subscribe, readLogsRaw, () => "[]");
  return useMemo(() => {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isLogEntry);
    } catch {
      return [];
    }
  }, [raw]);
}

export function useSessionId(): string {
  return useSyncExternalStore(subscribe, readSessionRaw, () => "");
}

export function ensureSessionId(): string {
  const existing = readSessionRaw();
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, id);
  emit();
  return id;
}

export function createLog(
  partial: Omit<LogEntry, "createdAt" | "updatedAt" | "sessionId" | "viewportWidth"> & {
    createdAt: string;
  },
): LogEntry {
  return {
    ...partial,
    sessionId: ensureSessionId(),
    updatedAt: new Date().toISOString(),
    viewportWidth: viewportWidth(),
  };
}

export function upsertLog(entry: LogEntry): boolean {
  try {
    const parsed = JSON.parse(readLogsRaw()) as unknown;
    const list = Array.isArray(parsed) ? parsed.filter(isLogEntry) : [];
    const index = list.findIndex((item) => item.id === entry.id);
    if (index >= 0) list[index] = entry;
    else list.push(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(list));
    emit();
    return true;
  } catch {
    return false;
  }
}

export function clearLogs(): void {
  localStorage.removeItem(LOG_KEY);
  emit();
}

export function logsToCsv(logs: LogEntry[]): string {
  const headers: (keyof LogEntry)[] = [
    "id",
    "sessionId",
    "createdAt",
    "updatedAt",
    "poc",
    "seriesId",
    "condition",
    "timeToAnswerMs",
    "revealMs",
    "recallPrompt",
    "recallAnswer",
    "recallTimeMs",
    "guessJson",
    "viewportWidth",
  ];
  const lines = [headers.join(",")];
  for (const log of logs) {
    lines.push(headers.map((header) => csvCell(log[header])).join(","));
  }
  return `\uFEFF${lines.join("\n")}`;
}

function csvCell(value: string | number | null): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function numericGuesses(logs: LogEntry[], poc: PocId, seriesId: string): number[] {
  const values: number[] = [];
  for (const log of logs) {
    if (log.poc !== poc || log.seriesId !== seriesId) continue;
    try {
      const guess = JSON.parse(log.guessJson) as { type?: string; value?: number };
      if (guess.type === "number" && typeof guess.value === "number") {
        values.push(guess.value);
      }
    } catch {
      // Ignore a damaged row. The table still shows the raw JSON.
    }
  }
  return values;
}

export function viewportWidth(): number | null {
  if (typeof window === "undefined") return null;
  return window.innerWidth;
}

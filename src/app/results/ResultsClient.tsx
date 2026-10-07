"use client";

import Link from "next/link";
import { Button, Shell } from "@/components/Shell";
import { clearLogs, logsToCsv, useLogs, useSessionId } from "@/lib/logs";

export function ResultsClient() {
  const logs = useLogs();
  const sessionId = useSessionId();

  function download() {
    const csv = logsToCsv(logs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plotcall-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function clear() {
    const confirmed = window.confirm("Clear every saved answer on this phone?");
    if (confirmed) clearLogs();
  }

  return (
    <Shell
      kicker="Tester log"
      title="Results on this phone"
      lede="Answers stay in this browser until you clear them or download a CSV. They are not sent to a server."
    >
      <p className="text-sm text-muted">
        Session{" "}
        <span className="font-mono text-ink">{sessionId ? sessionId.slice(0, 8) : "not started yet"}</span>
        {" · "}
        {logs.length} {logs.length === 1 ? "row" : "rows"}
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button onClick={download} disabled={logs.length === 0}>
          Download CSV
        </Button>
        <Button variant="danger" onClick={clear} disabled={logs.length === 0}>
          Clear this phone
        </Button>
      </div>

      {logs.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white px-4 py-6 text-base leading-relaxed ring-1 ring-line">
          No answers saved yet. Open a prototype, lock in a guess, and come back here.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <caption className="px-3 py-3 text-left text-sm text-muted">
              Scroll sideways to see every column. Times are in milliseconds.
            </caption>
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold">POC</th>
                <th className="px-3 py-2 font-semibold">Condition</th>
                <th className="px-3 py-2 font-semibold">Seconds</th>
                <th className="px-3 py-2 font-semibold">Guess</th>
                <th className="px-3 py-2 font-semibold">Recall</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-line align-top last:border-0">
                  <td className="px-3 py-3 whitespace-nowrap">{formatWhen(log.createdAt)}</td>
                  <td className="px-3 py-3">{log.poc}</td>
                  <td className="px-3 py-3">{log.condition}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatSeconds(log.timeToAnswerMs)}</td>
                  <td className="px-3 py-3">{summarizeGuess(log.guessJson)}</td>
                  <td className="px-3 py-3">
                    {log.recallAnswer
                      ? `${log.recallAnswer} (${formatSeconds(log.recallTimeMs)})`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-sm">
        <Link href="/" className="font-semibold text-ink underline underline-offset-4">
          Back to the three prototypes
        </Link>
      </p>
    </Shell>
  );
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("nl-NL", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSeconds(ms: number | null) {
  if (ms === null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

function summarizeGuess(guessJson: string) {
  try {
    const guess = JSON.parse(guessJson) as {
      type?: string;
      value?: number;
      probability?: number;
      values?: number[];
    };
    if (guess.type === "none") return "No guess (read)";
    if (guess.type === "number" && typeof guess.value === "number") {
      return new Intl.NumberFormat("nl-NL").format(Math.round(guess.value));
    }
    if (guess.type === "probability" && typeof guess.probability === "number") {
      return `${guess.probability}% yes`;
    }
    if (guess.type === "line" && Array.isArray(guess.values) && guess.values.length > 0) {
      const end = guess.values[guess.values.length - 1];
      return `Line, ends at ${new Intl.NumberFormat("nl-NL").format(Math.round(end))}`;
    }
  } catch {
    return "Unreadable guess";
  }
  return "Unreadable guess";
}

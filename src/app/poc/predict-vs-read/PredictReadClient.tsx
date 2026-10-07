"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { eindhovenHomePrices, storyFor, valueInYear } from "@/data/stats";
import { Button, Shell, SourceNote, TesterNote } from "@/components/Shell";
import { TrendChart, emptyGuess, guessIsComplete } from "@/components/TrendChart";
import { compareToActual, formatValue, parseLooseNumber } from "@/lib/format";
import { createLog, upsertLog } from "@/lib/logs";
import { useRandomArm } from "@/lib/useRandomArm";

const series = eindhovenHomePrices;

export function PredictReadClient() {
  const arm = useRandomArm();
  const [phase, setPhase] = useState<"auto" | "guess" | "reveal" | "recall" | "done">("auto");
  const [guess, setGuess] = useState<(number | null)[]>(() => emptyGuess(series.points.length));
  const [drawKey, setDrawKey] = useState(0);
  const [recallInput, setRecallInput] = useState("");
  const [recallError, setRecallError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savedAnswer, setSavedAnswer] = useState<number | null>(null);

  const started = useRef(false);
  const perfStart = useRef(0);
  const wallStart = useRef("");
  const revealStart = useRef(0);
  const recallStart = useRef(0);
  const answerMs = useRef<number | null>(null);
  const revealMs = useRef<number | null>(null);
  const logId = useRef("");

  const screen = !arm ? "loading" : phase === "auto" ? (arm === "read" ? "reveal" : "guess") : phase;

  useEffect(() => {
    if (!arm || started.current) return;
    started.current = true;
    perfStart.current = performance.now();
    wallStart.current = new Date().toISOString();
    logId.current = crypto.randomUUID();
    if (arm === "read") revealStart.current = performance.now();
  }, [arm]);

  useEffect(() => {
    if (screen === "loading" || screen === "guess" || (screen === "reveal" && phase === "auto")) return;
    document.getElementById("poc-heading")?.focus();
  }, [screen, phase]);

  function restart() {
    setPhase("auto");
    setGuess(emptyGuess(series.points.length));
    setDrawKey((key) => key + 1);
    setRecallInput("");
    setRecallError("");
    setSaveError("");
    setSavedAnswer(null);
    perfStart.current = performance.now();
    wallStart.current = new Date().toISOString();
    logId.current = crypto.randomUUID();
    answerMs.current = null;
    revealMs.current = null;
    if (arm === "read") revealStart.current = performance.now();
  }

  function lockGuess() {
    if (!guessIsComplete(guess)) return;
    answerMs.current = Math.round(performance.now() - perfStart.current);
    revealStart.current = performance.now();
    const saved = upsertLog(
      createLog({
        id: logId.current,
        createdAt: wallStart.current,
        poc: "predict-vs-read",
        seriesId: series.id,
        condition: "predict",
        timeToAnswerMs: answerMs.current,
        revealMs: null,
        recallPrompt: series.recall?.prompt ?? "",
        recallAnswer: "",
        recallTimeMs: null,
        guessJson: JSON.stringify({
          type: "line",
          years: series.points.map((point) => point.year),
          values: guess,
        }),
      }),
    );
    setSaveError(saved ? "" : "Could not save on this phone. Check that site storage is allowed.");
    setPhase("reveal");
  }

  function continueToRecall() {
    const spent = Math.round(performance.now() - (revealStart.current || perfStart.current));
    revealMs.current = spent;
    if (arm === "read") answerMs.current = spent;
    recallStart.current = performance.now();
    if (arm === "read") {
      const saved = upsertLog(
        createLog({
          id: logId.current,
          createdAt: wallStart.current,
          poc: "predict-vs-read",
          seriesId: series.id,
          condition: "read",
          timeToAnswerMs: spent,
          revealMs: spent,
          recallPrompt: series.recall?.prompt ?? "",
          recallAnswer: "",
          recallTimeMs: null,
          guessJson: JSON.stringify({ type: "none" }),
        }),
      );
      setSaveError(saved ? "" : "Could not save on this phone. Check that site storage is allowed.");
    }
    setPhase("recall");
  }

  function submitRecall() {
    const parsed = parseLooseNumber(recallInput);
    if (parsed === null) {
      setRecallError("Type a number, such as 450000 or 450.000.");
      return;
    }
    const recallTimeMs = Math.round(performance.now() - recallStart.current);
    const saved = upsertLog(
      createLog({
        id: logId.current,
        createdAt: wallStart.current,
        poc: "predict-vs-read",
        seriesId: series.id,
        condition: arm ?? "predict",
        timeToAnswerMs: answerMs.current,
        revealMs: revealMs.current,
        recallPrompt: series.recall?.prompt ?? "",
        recallAnswer: String(parsed),
        recallTimeMs,
        guessJson:
          arm === "read"
            ? JSON.stringify({ type: "none" })
            : JSON.stringify({
                type: "line",
                years: series.points.map((point) => point.year),
                values: guess,
              }),
      }),
    );
    setSaveError(saved ? "" : "Could not save on this phone. Check that site storage is allowed.");
    if (!saved) return;
    setSavedAnswer(parsed);
    setPhase("done");
  }

  if (screen === "loading" || !arm) {
    return (
      <Shell kicker="Predict vs read" title="Setting up this phone…">
        <p className="text-muted">Choosing predict or read at random.</p>
      </Shell>
    );
  }

  const actual = valueInYear(series, series.recall?.year ?? 2025);
  const title =
    screen === "recall"
      ? "One memory question"
      : screen === "done"
        ? "Saved on this phone"
        : arm === "predict" && screen === "guess"
          ? "Draw how Eindhoven sale prices moved"
          : "Average sale prices in Eindhoven";

  return (
    <Shell
      kicker={`Predict vs read · condition ${arm}`}
      title={title}
      lede={
        screen === "guess"
          ? "Drag from left to right. The axis runs from €0 to €800,000, so the real line does not have to touch the top."
          : screen === "reveal"
            ? "The solid line is the CBS series. A dashed line, if you drew one, is your guess."
            : screen === "recall"
              ? "The chart is hidden. Answer from memory. A rough number is enough."
              : "Your answer is stored with the condition and the timings."
      }
    >
      {screen === "guess" ? (
        <>
          <TrendChart
            key={drawKey}
            points={series.points}
            domain={series.domain}
            format={series.format}
            unitLabel={series.unitLabel}
            guess={guess}
            showTruth={false}
            interactive
            onGuessChange={setGuess}
            ariaLabel="Drawing surface for Eindhoven sale prices from 2015 to 2025. Drag across the years, or use the arrow keys."
          />
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Keyboard: tab to the chart, left and right pick a year, up and down set the value.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" disabled={!guessIsComplete(guess)} onClick={lockGuess}>
              Lock in my guess
            </Button>
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => {
                setGuess(emptyGuess(series.points.length));
                setDrawKey((key) => key + 1);
              }}
            >
              Clear line
            </Button>
          </div>
        </>
      ) : null}

      {screen === "reveal" ? (
        <>
          <TrendChart
            points={series.points}
            domain={series.domain}
            format={series.format}
            unitLabel={series.unitLabel}
            guess={arm === "predict" ? guess : null}
            showTruth
            interactive={false}
            ariaLabel="CBS average sale price of existing homes in Eindhoven, 2015 to 2025."
          />
          <p className="story-in mt-4 text-base leading-relaxed">{storyFor(series)}</p>
          <SourceNote source={series.source} placeholder={series.placeholder} />
          <Button className="mt-6 w-full" onClick={continueToRecall}>
            Continue to the memory question
          </Button>
        </>
      ) : null}

      {screen === "recall" && series.recall ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitRecall();
          }}
        >
          <label className="block text-base font-medium" htmlFor="recall">
            {series.recall.prompt}
          </label>
          <input
            id="recall"
            inputMode="decimal"
            autoComplete="off"
            value={recallInput}
            onChange={(event) => {
              setRecallInput(event.target.value);
              setRecallError("");
            }}
            className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-base ring-1 ring-line"
          />
          <p className="mt-2 text-sm text-muted">Euros, for example 450000 or 450.000.</p>
          {recallError ? (
            <p className="mt-2 text-sm font-medium text-truth" role="alert">
              {recallError}
            </p>
          ) : null}
          <Button type="submit" className="mt-4 w-full">
            Save my answer
          </Button>
        </form>
      ) : null}

      {screen === "done" ? (
        <>
          <p className="text-base leading-relaxed">
            {savedAnswer === null
              ? "Saved."
              : `You answered ${formatValue(savedAnswer, "euro")}. ${compareToActual(savedAnswer, actual, "euro")}`}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={restart}>Try this prototype again</Button>
            <Link
              href="/results"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-4 text-base font-semibold text-ink ring-1 ring-line"
            >
              Open the results log
            </Link>
          </div>
        </>
      ) : null}

      {saveError ? (
        <p className="mt-4 text-sm font-medium text-truth" role="alert">
          {saveError}
        </p>
      ) : null}

      <TesterNote>
        <p>
          Open <span className="font-mono text-ink">?v=predict</span> or{" "}
          <span className="font-mono text-ink">?v=read</span>. With no parameter, the phone is
          assigned 50/50 and the choice is written into the URL.
        </p>
        <p>
          Predict logs the drawn line and the time to lock it in. Read logs time spent on the
          chart before the memory question. Both log the recall answer and how long that
          question took. Nothing is uploaded; it stays in localStorage on this phone.
        </p>
      </TesterNote>
    </Shell>
  );
}

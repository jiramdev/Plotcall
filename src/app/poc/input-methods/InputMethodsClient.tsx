"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { netherlandsBicycleKm, storyFor, valueInYear } from "@/data/stats";
import { NumberSlider } from "@/components/NumberSlider";
import { Button, Shell, SourceNote, TesterNote } from "@/components/Shell";
import { TrendChart, emptyGuess, guessIsComplete } from "@/components/TrendChart";
import { compareToActual, elapsedSince, formatValue } from "@/lib/format";
import { createLog, upsertLog } from "@/lib/logs";

const series = netherlandsBicycleKm;
const methods = ["draw", "slider", "choice"] as const;
type Method = (typeof methods)[number];

function parseMethod(raw: string | null): Method {
  if (raw === "slider" || raw === "choice" || raw === "draw") return raw;
  return "draw";
}

export function InputMethodsClient() {
  const params = useSearchParams();
  const router = useRouter();
  const method = parseMethod(params.get("m"));

  function choose(next: Method) {
    const search = new URLSearchParams(params.toString());
    search.set("m", next);
    router.replace(`/poc/input-methods?${search.toString()}`, { scroll: false });
  }

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = methods.indexOf(method);
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = methods[(index + direction + methods.length) % methods.length];
    choose(next);
  }

  const lede =
    method === "draw"
      ? "Drag the shape you expect from 2018 to 2023. The axis runs from 0 to 2,000 km."
      : method === "slider"
        ? series.slider.prompt
        : series.odds?.prompt;

  return (
    <Shell kicker={`Input methods · ${method}`} title="How far did people cycle?" lede={lede}>
      <div
        role="tablist"
        aria-label="Way to guess"
        className="mb-4 grid grid-cols-3 gap-1 rounded-full bg-white p-1 ring-1 ring-line"
        onKeyDown={onTabKey}
      >
        {methods.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            id={`tab-${item}`}
            aria-selected={method === item}
            aria-controls="method-panel"
            tabIndex={method === item ? 0 : -1}
            className={`min-h-11 rounded-full px-2 text-sm font-semibold ${
              method === item ? "bg-pine text-white" : "text-ink"
            }`}
            onClick={() => choose(item)}
          >
            {item === "draw" ? "Draw" : item === "slider" ? "Slider" : "Yes / no"}
          </button>
        ))}
      </div>
      <MethodTrial key={method} method={method} onChoose={choose} />
      <TesterNote>
        <p>
          Open <span className="font-mono text-ink">?m=draw</span>,{" "}
          <span className="font-mono text-ink">?m=slider</span>, or{" "}
          <span className="font-mono text-ink">?m=choice</span>. The tabs set the same parameter.
          Switching method starts the timer again and keeps earlier rows in the log.
        </p>
        <p>
          Each row stores the method, the guess (the line, the number, or the probability), and
          the time to lock it in. Choice also stores whether the CBS figure was above the
          threshold. Storage is localStorage on this phone.
        </p>
      </TesterNote>
    </Shell>
  );
}

function MethodTrial({
  method,
  onChoose,
}: {
  method: Method;
  onChoose: (method: Method) => void;
}) {
  const [phase, setPhase] = useState<"guess" | "reveal">("guess");
  const [line, setLine] = useState<(number | null)[]>(() => emptyGuess(series.points.length));
  const [drawKey, setDrawKey] = useState(0);
  const [slider, setSlider] = useState(series.slider.initial);
  const [probability, setProbability] = useState(50);
  const [interacted, setInteracted] = useState(false);
  const [saveError, setSaveError] = useState("");
  const perfStart = useRef(0);
  const wallStart = useRef("");
  const logId = useRef("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    perfStart.current = performance.now();
    wallStart.current = new Date().toISOString();
    logId.current = crypto.randomUUID();
  }, []);

  const odds = series.odds;
  const actualYear = method === "choice" && odds ? odds.year : series.slider.year;
  const actual = valueInYear(series, actualYear);
  const above = odds ? actual > odds.above : false;
  const sliderGuess = series.points.map((point) =>
    point.year === series.slider.year ? slider : null,
  );
  const canSubmit = method === "draw" ? guessIsComplete(line) : true;

  function lockGuess() {
    const timeToAnswerMs = elapsedSince(perfStart.current);
    let guessJson = "";
    if (method === "draw") {
      if (!guessIsComplete(line)) return;
      guessJson = JSON.stringify({
        type: "line",
        years: series.points.map((point) => point.year),
        values: line,
      });
    } else if (method === "slider") {
      guessJson = JSON.stringify({
        type: "number",
        year: series.slider.year,
        value: slider,
        interacted,
      });
    } else if (odds) {
      guessJson = JSON.stringify({
        type: "probability",
        year: odds.year,
        threshold: odds.above,
        probability,
        actual,
        outcome: above ? "above" : "not-above",
        interacted,
      });
    }

    const saved = upsertLog(
      createLog({
        id: logId.current,
        createdAt: wallStart.current || new Date().toISOString(),
        poc: "input-methods",
        seriesId: series.id,
        condition: method,
        timeToAnswerMs,
        revealMs: null,
        recallPrompt: "",
        recallAnswer: "",
        recallTimeMs: null,
        guessJson,
      }),
    );
    setSaveError(saved ? "" : "Could not save on this phone. Check that site storage is allowed.");
    if (saved) setPhase("reveal");
  }

  return (
    <>
      <div role="tabpanel" id="method-panel" aria-labelledby={`tab-${method}`}>
        {phase === "guess" && method === "draw" ? (
          <>
            <TrendChart
              key={drawKey}
              points={series.points}
              domain={series.domain}
              format={series.format}
              unitLabel={series.unitLabel}
              guess={line}
              showTruth={false}
              interactive
              onGuessChange={setLine}
              ariaLabel="Drawing surface for bicycle kilometres per person, 2018 to 2023."
            />
            <p className="mt-3 text-sm text-muted">
              Keyboard: tab to the chart, left and right pick a year, up and down set the value.
            </p>
            <Button
              variant="ghost"
              className="mt-3"
              onClick={() => {
                setLine(emptyGuess(series.points.length));
                setDrawKey((key) => key + 1);
              }}
            >
              Clear line
            </Button>
          </>
        ) : null}

        {phase === "guess" && method === "slider" ? (
          <NumberSlider
            label="Your guess for 2023"
            value={slider}
            min={series.slider.min}
            max={series.slider.max}
            step={series.slider.step}
            display={formatValue(slider, "km")}
            minLabel={formatValue(series.slider.min, "km")}
            maxLabel={formatValue(series.slider.max, "km")}
            onChange={(value) => {
              setSlider(value);
              setInteracted(true);
            }}
          />
        ) : null}

        {phase === "guess" && method === "choice" && odds ? (
          <div>
            <p className="text-sm text-muted">A probability, not a bet.</p>
            <NumberSlider
              label="How likely is yes?"
              value={probability}
              min={0}
              max={100}
              step={1}
              display={`${probability}%`}
              minLabel="0% no"
              maxLabel="100% yes"
              onChange={(value) => {
                setProbability(value);
                setInteracted(true);
              }}
            />
          </div>
        ) : null}

        {phase === "reveal" ? (
          <>
            <TrendChart
              points={series.points}
              domain={series.domain}
              format={series.format}
              unitLabel={series.unitLabel}
              guess={method === "draw" ? line : method === "slider" ? sliderGuess : null}
              showTruth
              interactive={false}
              ariaLabel="CBS bicycle kilometres per person in the Netherlands, 2018 to 2023."
            />
            <p className="story-in mt-4 text-base leading-relaxed">
              {method === "slider"
                ? compareToActual(slider, actual, "km")
                : method === "choice" && odds
                  ? `You put yes at ${probability}%. The 2023 average was ${formatValue(actual, "km")}, which is ${above ? "above" : "not above"} ${formatValue(odds.above, "km")}.`
                  : "Your line stays dashed. The solid line is the CBS series."}
            </p>
            <p className="story-in mt-3 text-base leading-relaxed">{storyFor(series)}</p>
            <SourceNote source={series.source} placeholder={series.placeholder} />
          </>
        ) : null}
      </div>

      {phase === "guess" ? (
        <Button className="mt-6 w-full" disabled={!canSubmit} onClick={lockGuess}>
          Lock in my guess
        </Button>
      ) : (
        <Button
          className="mt-6 w-full"
          variant="ghost"
          onClick={() => onChoose(method === "draw" ? "slider" : method === "slider" ? "choice" : "draw")}
        >
          Try another way of guessing
        </Button>
      )}

      {saveError ? (
        <p className="mt-4 text-sm font-medium text-truth" role="alert">
          {saveError}
        </p>
      ) : null}
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  eindhovenPopulation,
  simulatedEindhovenPopulationGuesses,
  storyFor,
  valueInYear,
} from "@/data/stats";
import { Histogram } from "@/components/Histogram";
import { NumberSlider } from "@/components/NumberSlider";
import { Button, Shell, SourceNote, TesterNote } from "@/components/Shell";
import { TrendChart } from "@/components/TrendChart";
import { compareToActual, formatValue } from "@/lib/format";
import { createLog, numericGuesses, upsertLog, useLogs } from "@/lib/logs";

const series = eindhovenPopulation;
const REAL_GUESS_LIMIT = 8;

export function CrowdClient() {
  const params = useSearchParams();
  const router = useRouter();
  const logs = useLogs();
  const crowdOn = params.get("crowd") !== "off";
  const [phase, setPhase] = useState<"guess" | "reveal">("guess");
  const [slider, setSlider] = useState(series.slider.initial);
  const [interacted, setInteracted] = useState(false);
  const [lockedValue, setLockedValue] = useState<number | null>(null);
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

  function setCrowd(on: boolean) {
    const search = new URLSearchParams(params.toString());
    search.set("crowd", on ? "on" : "off");
    router.replace(`/poc/crowd?${search.toString()}`, { scroll: false });
  }

  function restart() {
    setPhase("guess");
    setSlider(series.slider.initial);
    setInteracted(false);
    setLockedValue(null);
    setSaveError("");
    perfStart.current = performance.now();
    wallStart.current = new Date().toISOString();
    logId.current = crypto.randomUUID();
  }

  function submit() {
    const timeToAnswerMs = Math.round(performance.now() - perfStart.current);
    const saved = upsertLog(
      createLog({
        id: logId.current,
        createdAt: wallStart.current || new Date().toISOString(),
        poc: "crowd",
        seriesId: series.id,
        condition: crowdOn ? "crowd-on" : "crowd-off",
        timeToAnswerMs,
        revealMs: null,
        recallPrompt: "",
        recallAnswer: "",
        recallTimeMs: null,
        guessJson: JSON.stringify({
          type: "number",
          year: series.slider.year,
          value: slider,
          interacted,
        }),
      }),
    );
    setSaveError(saved ? "" : "Could not save on this phone. Check that site storage is allowed.");
    if (!saved) return;
    setLockedValue(slider);
    setPhase("reveal");
  }

  const actual = valueInYear(series, series.slider.year);
  const you = lockedValue ?? slider;
  const stored = numericGuesses(logs, "crowd", series.id);
  const real = stored.includes(you) || phase !== "reveal" ? stored : [...stored, you];
  const showSimulated = real.length < REAL_GUESS_LIMIT;

  return (
    <Shell
      kicker={`Crowd · ${crowdOn ? "on" : "off"}`}
      title={phase === "guess" ? series.slider.prompt : "Eindhoven, 1 January 2026"}
      lede={
        phase === "guess"
          ? "Move the slider, then lock it in. The crowd layer, if it is on, appears only after your guess."
          : compareToActual(you, actual, "people")
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-white p-1 ring-1 ring-line" role="group" aria-label="Crowd layer">
        <button
          type="button"
          aria-pressed={crowdOn}
          className={`min-h-11 rounded-full px-3 text-sm font-semibold ${crowdOn ? "bg-pine text-white" : "text-ink"}`}
          onClick={() => setCrowd(true)}
        >
          With crowd
        </button>
        <button
          type="button"
          aria-pressed={!crowdOn}
          className={`min-h-11 rounded-full px-3 text-sm font-semibold ${!crowdOn ? "bg-pine text-white" : "text-ink"}`}
          onClick={() => setCrowd(false)}
        >
          Number only
        </button>
      </div>

      {phase === "guess" ? (
        <>
          <NumberSlider
            label="People"
            value={slider}
            min={series.slider.min}
            max={series.slider.max}
            step={series.slider.step}
            display={formatValue(slider, "people")}
            minLabel={formatValue(series.slider.min, "people")}
            maxLabel={formatValue(series.slider.max, "people")}
            onChange={(value) => {
              setSlider(value);
              setInteracted(true);
            }}
          />
          <Button className="mt-6 w-full" onClick={submit}>
            Lock in my guess
          </Button>
        </>
      ) : (
        <>
          <p className="text-4xl font-semibold tabular-nums tracking-tight">
            {formatValue(actual, "people")}
          </p>
          <p className="mt-1 text-sm text-muted">CBS count on 1 January 2026</p>

          {crowdOn ? (
            <div className="mt-5">
              {showSimulated ? (
                <p className="mb-2 inline-flex rounded-full bg-[#f4df9a] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#5c4300] ring-1 ring-[#c9a227]">
                  Simulated crowd
                </p>
              ) : null}
              <Histogram
                domain={{ min: series.slider.min, max: series.slider.max }}
                simulated={showSimulated ? simulatedEindhovenPopulationGuesses : null}
                real={real}
                truth={actual}
                you={you}
                format="people"
              />
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {showSimulated
                  ? `Pale bars are ${simulatedEindhovenPopulationGuesses.length} made-up guesses so the chart is visible on an empty phone. They are not real people. Dark bars are guesses saved on this phone (${real.length}). After ${REAL_GUESS_LIMIT} saved guesses, the simulated bars drop out.`
                  : `Showing ${real.length} guesses saved on this phone. The simulated crowd is hidden.`}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Crowd layer is off, so other guesses stay hidden. Your answer is still saved.
            </p>
          )}

          <div className="mt-5">
            <TrendChart
              points={series.points}
              domain={series.domain}
              format={series.format}
              unitLabel={series.unitLabel}
              guess={null}
              showTruth
              interactive={false}
              ariaLabel="CBS population of Eindhoven on 1 January, 2015 to 2026."
            />
          </div>
          <p className="story-in mt-4 text-base leading-relaxed">{storyFor(series)}</p>
          <SourceNote source={series.source} placeholder={series.placeholder} />
          <Button className="mt-6 w-full" variant="ghost" onClick={restart}>
            Guess again
          </Button>
        </>
      )}

      {saveError ? (
        <p className="mt-4 text-sm font-medium text-truth" role="alert">
          {saveError}
        </p>
      ) : null}

      <TesterNote>
        <p>
          Open <span className="font-mono text-ink">?crowd=on</span> or{" "}
          <span className="font-mono text-ink">?crowd=off</span>. The switch above sets the same
          parameter. The logged condition is whichever layer was active when the guess was locked
          in. You can still flip the switch afterwards to compare the two screens.
        </p>
        <p>
          Guesses from this phone are the dark bars. Across phones they do not sync. The pale
          bars are a fixed simulated crowd, labelled on screen, and only while this phone has
          fewer than {REAL_GUESS_LIMIT} saved guesses.
        </p>
      </TesterNote>
    </Shell>
  );
}

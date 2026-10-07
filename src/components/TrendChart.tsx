"use client";

import { useRef, useState } from "react";
import type { SeriesPoint } from "@/data/stats";
import { formatAxis, formatValue, type ValueFormat } from "@/lib/format";

const WIDTH = 360;
const HEIGHT = 236;
const PAD = { top: 16, right: 10, bottom: 30, left: 46 };

type TrendChartProps = {
  points: SeriesPoint[];
  domain: { min: number; max: number };
  format: ValueFormat;
  unitLabel: string;
  guess: (number | null)[] | null;
  showTruth: boolean;
  interactive: boolean;
  onGuessChange?: (guess: (number | null)[]) => void;
  ariaLabel: string;
};

export function TrendChart({
  points,
  domain,
  format,
  unitLabel,
  guess,
  showTruth,
  interactive,
  onGuessChange,
  ariaLabel,
}: TrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lastIndex = useRef<number | null>(null);
  const guessRef = useRef<(number | null)[] | null>(guess);
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState("");
  const n = points.length;
  const x0 = PAD.left;
  const x1 = WIDTH - PAD.right;
  const y0 = HEIGHT - PAD.bottom;
  const y1 = PAD.top;

  function xAt(index: number) {
    if (n <= 1) return (x0 + x1) / 2;
    return x0 + (index / (n - 1)) * (x1 - x0);
  }

  function yAt(value: number) {
    const span = domain.max - domain.min || 1;
    return y0 - ((value - domain.min) / span) * (y0 - y1);
  }

  function valueAtY(y: number) {
    const span = domain.max - domain.min || 1;
    const t = (y0 - y) / (y0 - y1);
    return clamp(domain.min + t * span, domain.min, domain.max);
  }

  function indexAtX(x: number) {
    if (n <= 1) return 0;
    return ((x - x0) / (x1 - x0)) * (n - 1);
  }

  function pointerValue(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const mapped = point.matrixTransform(matrix.inverse());
    return { index: indexAtX(mapped.x), value: valueAtY(mapped.y) };
  }

  function paint(indexFloat: number, value: number, connect: boolean) {
    if (!onGuessChange) return;
    const current = guessRef.current ? [...guessRef.current] : Array<number | null>(n).fill(null);
    const target = clamp(Math.round(indexFloat), 0, n - 1);
    if (!connect || lastIndex.current === null) {
      current[target] = value;
    } else {
      const origin = clamp(Math.round(lastIndex.current), 0, n - 1);
      const from = Math.min(origin, target);
      const to = Math.max(origin, target);
      const startValue = current[origin] ?? value;
      for (let index = from; index <= to; index += 1) {
        const t = target === origin ? 1 : (index - origin) / (target - origin);
        current[index] = startValue + (value - startValue) * t;
      }
    }
    lastIndex.current = indexFloat;
    guessRef.current = current;
    onGuessChange(current);
    setSelected(target);
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (!interactive) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    lastIndex.current = null;
    const hit = pointerValue(event);
    if (!hit) return;
    paint(hit.index, hit.value, false);
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!interactive || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const hit = pointerValue(event);
    if (!hit) return;
    paint(hit.index, hit.value, true);
  }

  function onPointerUp() {
    lastIndex.current = null;
    const currentGuess = guessRef.current;
    if (!currentGuess) return;
    const filled = currentGuess.filter((value) => value !== null).length;
    setStatus(
      filled === n
        ? "Line set for every year. You can lock it in, or draw again to change it."
        : `${filled} of ${n} years set. Drag across the years that are still empty.`,
    );
  }

  function onKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
    if (!interactive || !onGuessChange) return;
    const current = guessRef.current ? [...guessRef.current] : Array<number | null>(n).fill(null);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSelected((index) => Math.min(n - 1, index + 1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSelected((index) => Math.max(0, index - 1));
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const step = (domain.max - domain.min) / 40;
      const direction = event.key === "ArrowUp" ? 1 : -1;
      const previous = current[selected] ?? (domain.min + domain.max) / 2;
      current[selected] = clamp(previous + direction * step, domain.min, domain.max);
      guessRef.current = current;
      onGuessChange(current);
      setStatus(
        `${points[selected].year}: ${formatValue(current[selected] ?? 0, format)}.`,
      );
    }
  }

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(
    (t) => domain.min + t * (domain.max - domain.min),
  );
  const truthPath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xAt(index).toFixed(1)} ${yAt(point.value).toFixed(1)}`)
    .join(" ");
  const guessPath = pathFromGuess(guess, xAt, yAt);
  const shortYears = n > 8;

  return (
    <div className="rounded-2xl bg-white p-2 ring-1 ring-line">
      <p className="px-2 pt-1 text-xs font-medium text-muted">{unitLabel}</p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={`h-auto w-full ${interactive ? "touch-none" : ""}`}
        role={interactive ? "application" : "img"}
        aria-label={ariaLabel}
        tabIndex={interactive ? 0 : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={x0}
              x2={x1}
              y1={yAt(tick)}
              y2={yAt(tick)}
              className="stroke-line"
              strokeWidth={1}
            />
            <text
              x={x0 - 6}
              y={yAt(tick) + 4}
              textAnchor="end"
              className="fill-muted text-[11px]"
            >
              {formatAxis(tick, format)}
            </text>
          </g>
        ))}
        {points.map((point, index) => (
          <g key={point.year}>
            <line
              x1={xAt(index)}
              x2={xAt(index)}
              y1={y0}
              y2={interactive && selected === index ? y1 : y0 + 4}
              className={interactive && selected === index ? "stroke-guess" : "stroke-line"}
              strokeWidth={interactive && selected === index ? 2 : 1}
            />
            <text
              x={xAt(index)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-muted text-[11px]"
            >
              {shortYears ? String(point.year).slice(2) : point.year}
            </text>
          </g>
        ))}
        {guessPath ? (
          <path
            d={guessPath}
            fill="none"
            stroke="#1d4f91"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="5 4"
          />
        ) : null}
        {guess?.map((value, index) =>
          value === null ? null : (
            <circle key={points[index].year} cx={xAt(index)} cy={yAt(value)} r={3.2} fill="#1d4f91" />
          ),
        )}
        {showTruth ? (
          <path
            d={truthPath}
            pathLength={1}
            fill="none"
            stroke="#9f2d00"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="truth-line"
          />
        ) : null}
        {showTruth
          ? points.map((point, index) => (
              <circle
                key={`truth-${point.year}`}
                cx={xAt(index)}
                cy={yAt(point.value)}
                r={3.4}
                fill="#9f2d00"
                className="truth-dot"
                style={{ animationDelay: `${120 + index * 70}ms` }}
              />
            ))
          : null}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 pb-2 text-xs text-muted">
        {guess ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-guess" />
            Your guess
          </span>
        ) : null}
        {showTruth ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-0.5 w-5 bg-truth" />
            CBS figure
          </span>
        ) : null}
        {shortYears ? <span>Years {points[0].year}–{points[n - 1].year}</span> : null}
      </div>
      {interactive ? (
        <p className="sr-only" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  );
}

export function emptyGuess(length: number): (number | null)[] {
  return Array<number | null>(length).fill(null);
}

export function guessIsComplete(guess: (number | null)[] | null): guess is number[] {
  return !!guess && guess.length > 0 && guess.every((value) => value !== null);
}

function pathFromGuess(
  guess: (number | null)[] | null,
  xAt: (index: number) => number,
  yAt: (value: number) => number,
): string {
  if (!guess) return "";
  let path = "";
  let penDown = false;
  guess.forEach((value, index) => {
    if (value === null) {
      penDown = false;
      return;
    }
    path += `${penDown ? "L" : "M"} ${xAt(index).toFixed(1)} ${yAt(value).toFixed(1)} `;
    penDown = true;
  });
  return path.trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

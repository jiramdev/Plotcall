"use client";

import { formatAxis, type ValueFormat } from "@/lib/format";

const WIDTH = 360;
const HEIGHT = 210;
const PAD = { top: 28, right: 8, bottom: 28, left: 8 };

export function Histogram({
  domain,
  simulated,
  real,
  truth,
  you,
  format,
}: {
  domain: { min: number; max: number };
  simulated: readonly number[] | null;
  real: number[];
  truth: number;
  you: number;
  format: ValueFormat;
}) {
  const binCount = 12;
  const width = (domain.max - domain.min) / binCount;
  const simulatedBins = simulated ? countBins(simulated, domain.min, width, binCount) : null;
  const realBins = countBins(real, domain.min, width, binCount);
  const peak = Math.max(1, ...(simulatedBins ?? [0]), ...realBins);
  const plotBottom = HEIGHT - PAD.bottom;
  const plotHeight = plotBottom - PAD.top;
  const plotWidth = WIDTH - PAD.left - PAD.right;

  function xAt(value: number) {
    const t = (value - domain.min) / (domain.max - domain.min || 1);
    return PAD.left + clamp(t, 0, 1) * plotWidth;
  }

  const youX = xAt(you);
  const truthX = xAt(truth);
  const close = Math.abs(youX - truthX) < 56;

  return (
    <div className="rounded-2xl bg-white p-2 ring-1 ring-line">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="Distribution of guesses against the CBS figure">
        {Array.from({ length: binCount }, (_, index) => {
          const binX = PAD.left + (index / binCount) * plotWidth;
          const binW = plotWidth / binCount - 3;
          const simHeight = simulatedBins ? (simulatedBins[index] / peak) * plotHeight : 0;
          const realHeight = (realBins[index] / peak) * plotHeight;
          return (
            <g key={index}>
              {simHeight > 0 ? (
                <rect
                  x={binX}
                  y={plotBottom - simHeight}
                  width={binW}
                  height={simHeight}
                  rx={3}
                  fill="#e7d7a1"
                />
              ) : null}
              {realHeight > 0 ? (
                <rect
                  x={binX + binW * 0.22}
                  y={plotBottom - realHeight}
                  width={binW * 0.56}
                  height={realHeight}
                  rx={3}
                  fill="#14352c"
                />
              ) : null}
            </g>
          );
        })}
        <line x1={truthX} x2={truthX} y1={PAD.top - 4} y2={plotBottom} stroke="#9f2d00" strokeWidth={2} />
        <text x={close ? truthX - 6 : truthX} y={14} textAnchor={close ? "end" : "middle"} className="fill-truth text-[11px] font-semibold">
          CBS
        </text>
        <line x1={youX} x2={youX} y1={PAD.top - 4} y2={plotBottom} stroke="#1d4f91" strokeWidth={2} strokeDasharray="4 3" />
        <text x={close ? youX + 6 : youX} y={14} textAnchor={close ? "start" : "middle"} className="fill-guess text-[11px] font-semibold">
          You
        </text>
        {[domain.min, (domain.min + domain.max) / 2, domain.max].map((tick) => (
          <text key={tick} x={xAt(tick)} y={HEIGHT - 8} textAnchor="middle" className="fill-muted text-[11px]">
            {formatAxis(tick, format)}
          </text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 pb-2 text-xs text-muted">
        {simulated ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#e7d7a1]" />
            Simulated crowd
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-pine" />
          This phone
        </span>
      </div>
    </div>
  );
}

function countBins(values: readonly number[], min: number, width: number, binCount: number) {
  const bins = Array<number>(binCount).fill(0);
  for (const value of values) {
    let index = Math.floor((value - min) / width);
    if (index < 0) index = 0;
    if (index >= binCount) index = binCount - 1;
    bins[index] += 1;
  }
  return bins;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

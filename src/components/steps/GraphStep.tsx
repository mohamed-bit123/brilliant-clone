"use client";

import { useRef, useState } from "react";
import type { InteractionConfig } from "@/lib/types";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";

type GraphInteraction = Extract<InteractionConfig, { kind: "graph" }>;

type GraphStepProps = {
  interaction: GraphInteraction;
  feedback: { correct: string; incorrect: string; hint?: string };
  onComplete: (correct: boolean) => void;
  attempts: number;
};

type GraphModel = {
  xLabel: string;
  yLabel: string;
  xUnit: string;
  yUnit: string;
  xMin: number;
  xMax: number;
  compute: (x: number) => number;
  note: string;
};

function getGraphModel(interaction: GraphInteraction): GraphModel {
  if (interaction.graphType === "current-vs-resistance") {
    const V = interaction.fixedVoltage ?? 12;
    return {
      xLabel: "Resistance (Ω)",
      yLabel: "Current (A)",
      xUnit: "Ω",
      yUnit: "A",
      xMin: 1,
      xMax: 12,
      compute: (x) => (x <= 0 ? 0 : V / x),
      note: `V = ${V}V held constant`,
    };
  }
  if (interaction.graphType === "current-vs-voltage") {
    const R = interaction.fixedResistance ?? 6;
    return {
      xLabel: "Voltage (V)",
      yLabel: "Current (A)",
      xUnit: "V",
      yUnit: "A",
      xMin: 0,
      xMax: 18,
      compute: (x) => x / R,
      note: `R = ${R}Ω held constant`,
    };
  }
  const R = interaction.fixedResistance ?? 6;
  return {
    xLabel: "Voltage (V)",
    yLabel: "Power (W)",
    xUnit: "V",
    yUnit: "W",
    xMin: 0,
    xMax: 18,
    compute: (x) => (x * x) / R,
    note: `R = ${R}Ω held constant`,
  };
}

export function GraphStep({
  interaction,
  feedback,
  onComplete,
  attempts,
}: GraphStepProps) {
  const model = getGraphModel(interaction);

  if (interaction.questionType === "plot") {
    return (
      <PlotChallenge
        interaction={interaction}
        model={model}
        feedback={feedback}
        onComplete={onComplete}
        attempts={attempts}
      />
    );
  }

  return (
    <ReadQuestion
      interaction={interaction}
      model={model}
      feedback={feedback}
      onComplete={onComplete}
      attempts={attempts}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Read-off-the-curve question (mcq / numeric)                         */
/* ------------------------------------------------------------------ */

function ReadQuestion({
  interaction,
  model,
  feedback,
  onComplete,
  attempts,
}: GraphStepProps & { model: GraphModel }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [numeric, setNumeric] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  let isCorrect = false;
  if (interaction.questionType === "mcq") {
    isCorrect = selected === interaction.correctIndex;
  } else {
    const num = parseFloat(numeric);
    isCorrect =
      !Number.isNaN(num) &&
      Math.abs(num - (interaction.correctAnswer ?? 0)) <=
        (interaction.tolerance ?? 0.15);
  }

  return (
    <div>
      <GraphChart interaction={interaction} model={model} />

      {interaction.scenario && (
        <p className="mt-3 text-center text-sm text-slate-400">
          {interaction.scenario}
        </p>
      )}

      {interaction.questionType === "mcq" && interaction.options && (
        <div className="mt-4 flex flex-col gap-2">
          {interaction.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              disabled={submitted && isCorrect}
              onClick={() => !submitted && setSelected(i)}
              className={`rounded-xl border px-4 py-3 text-left text-sm ${
                selected === i
                  ? submitted
                    ? isCorrect
                      ? "border-emerald-500 bg-emerald-950/50"
                      : "border-red-500 bg-red-950/50"
                    : "border-sky-500 bg-sky-950/50"
                  : "border-slate-600 bg-slate-800/50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {interaction.questionType === "numeric" && (
        <div className="mt-4">
          <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-600 bg-slate-800 focus-within:border-sky-500">
            <input
              type="number"
              step="any"
              value={numeric}
              onChange={(e) => setNumeric(e.target.value)}
              placeholder="Enter your answer"
              disabled={submitted && isCorrect}
              className="w-full bg-transparent px-4 py-3 font-mono outline-none"
            />
            <span className="flex items-center bg-slate-700/60 px-4 font-mono text-sm text-slate-300">
              {model.yUnit}
            </span>
          </div>
        </div>
      )}

      {!submitted && (
        <>
          <button
            type="button"
            disabled={
              interaction.questionType === "mcq"
                ? selected === null
                : numeric.trim() === ""
            }
            onClick={() => setSubmitted(true)}
            className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-medium text-white disabled:opacity-40"
          >
            Check Answer
          </button>
          {attempts >= 2 && feedback.hint && !showHint && (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="mt-3 text-sm text-amber-400 underline"
            >
              Show hint
            </button>
          )}
          {showHint && feedback.hint && (
            <FeedbackBanner message={feedback.hint} variant="hint" />
          )}
        </>
      )}

      {submitted && (
        <FeedbackBanner
          message={isCorrect ? feedback.correct : feedback.incorrect}
          variant={isCorrect ? "correct" : "incorrect"}
        />
      )}

      {submitted && isCorrect && (
        <button
          type="button"
          onClick={() => onComplete(true)}
          className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white"
        >
          Continue
        </button>
      )}

      {submitted && !isCorrect && (
        <button
          type="button"
          onClick={() => {
            onComplete(false);
            setSelected(null);
            setNumeric("");
            setSubmitted(false);
          }}
          className="mt-4 w-full rounded-xl bg-slate-600 py-3 font-medium text-white"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Plot-the-points challenge                                           */
/* ------------------------------------------------------------------ */

const W = 320;
const H = 220;
const PAD = { l: 48, r: 16, t: 16, b: 40 };
const PLOT_W = W - PAD.l - PAD.r;
const PLOT_H = H - PAD.t - PAD.b;

function niceStep(maxValue: number, targetTicks = 5): number {
  const raw = maxValue / targetTicks;
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * pow);
  return candidates.find((c) => c >= raw) ?? candidates[candidates.length - 1];
}

function PlotChallenge({
  interaction,
  model,
  feedback,
  onComplete,
  attempts,
}: GraphStepProps & { model: GraphModel }) {
  const xs = interaction.plotXs ?? [];
  const expected = xs.map((x) => model.compute(x));

  const xMax = Math.max(...xs, 1);
  const yMaxRaw = Math.max(...expected, 1);
  const yStep = niceStep(yMaxRaw);
  const yMax = Math.ceil(yMaxRaw / yStep) * yStep || yStep;
  const yTickCount = Math.round(yMax / yStep);
  const tolerance = yStep / 2;

  const [placed, setPlaced] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const toSvg = (x: number, y: number) => ({
    sx: PAD.l + (x / xMax) * PLOT_W,
    sy: PAD.t + PLOT_H - (y / yMax) * PLOT_H,
  });

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (submitted) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;

    // Convert to data coordinates.
    const dataX = ((px - PAD.l) / PLOT_W) * xMax;
    const dataY = ((PAD.t + PLOT_H - py) / PLOT_H) * yMax;

    // Snap to the nearest required x value.
    let nearestIdx = 0;
    let bestDist = Infinity;
    xs.forEach((x, i) => {
      const d = Math.abs(x - dataX);
      if (d < bestDist) {
        bestDist = d;
        nearestIdx = i;
      }
    });

    // Snap y to the nearest gridline and clamp to range.
    let snappedY = Math.round(dataY / yStep) * yStep;
    snappedY = Math.max(0, Math.min(yMax, snappedY));

    setPlaced((prev) => ({ ...prev, [nearestIdx]: snappedY }));
  }

  const allPlaced = xs.every((_, i) => placed[i] !== undefined);
  const isCorrect =
    allPlaced &&
    xs.every((_, i) => Math.abs(placed[i] - expected[i]) <= tolerance + 1e-9);

  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => i * yStep);

  return (
    <div>
      <div className="rounded-xl border border-slate-600 bg-slate-900/80 p-3">
        <p className="mb-1 text-center text-xs text-slate-400">{model.note}</p>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto w-full max-w-sm cursor-crosshair touch-none"
          onClick={handleClick}
        >
          {/* horizontal gridlines + y labels */}
          {yTicks.map((ty) => {
            const { sy } = toSvg(0, ty);
            return (
              <g key={`y-${ty}`}>
                <line
                  x1={PAD.l}
                  y1={sy}
                  x2={PAD.l + PLOT_W}
                  y2={sy}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text x={PAD.l - 8} y={sy + 3} textAnchor="end" fill="#64748b" fontSize="9">
                  {Number.isInteger(ty) ? ty : ty.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* vertical guide lines at each required x */}
          {xs.map((x) => {
            const { sx } = toSvg(x, 0);
            return (
              <g key={`x-${x}`}>
                <line
                  x1={sx}
                  y1={PAD.t}
                  x2={sx}
                  y2={PAD.t + PLOT_H}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text x={sx} y={H - 22} textAnchor="middle" fill="#94a3b8" fontSize="10">
                  {x}
                </text>
              </g>
            );
          })}

          {/* axes */}
          <line x1={PAD.l} y1={PAD.t + PLOT_H} x2={PAD.l + PLOT_W} y2={PAD.t + PLOT_H} stroke="#64748b" strokeWidth="2" />
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + PLOT_H} stroke="#64748b" strokeWidth="2" />

          {/* connect placed points so the learner sees the shape forming */}
          {allPlaced && (
            <path
              d={xs
                .map((x, i) => {
                  const { sx, sy } = toSvg(x, placed[i]);
                  return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
                })
                .join(" ")}
              fill="none"
              stroke={submitted ? (isCorrect ? "#34d399" : "#f87171") : "#38bdf8"}
              strokeWidth="2"
              opacity="0.6"
            />
          )}

          {/* placed points */}
          {xs.map((x, i) => {
            if (placed[i] === undefined) return null;
            const { sx, sy } = toSvg(x, placed[i]);
            const ok = Math.abs(placed[i] - expected[i]) <= tolerance + 1e-9;
            const color = submitted ? (ok ? "#34d399" : "#f87171") : "#38bdf8";
            return <circle key={`p-${x}`} cx={sx} cy={sy} r={5} fill={color} />;
          })}

          {/* reveal correct points after a wrong submit */}
          {submitted &&
            !isCorrect &&
            xs.map((x, i) => {
              const { sx, sy } = toSvg(x, expected[i]);
              return (
                <circle
                  key={`c-${x}`}
                  cx={sx}
                  cy={sy}
                  r={4}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              );
            })}

          {/* axis titles */}
          <text x={PAD.l + PLOT_W / 2} y={H - 4} textAnchor="middle" fill="#94a3b8" fontSize="11">
            {model.xLabel}
          </text>
          <text
            x={14}
            y={PAD.t + PLOT_H / 2}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            transform={`rotate(-90 14 ${PAD.t + PLOT_H / 2})`}
          >
            {model.yLabel}
          </text>
        </svg>
      </div>

      <p className="mt-3 text-center text-sm text-slate-400">
        {interaction.scenario ??
          `Tap the graph to plot the ${model.yLabel.toLowerCase()} at each marked ${model.xLabel.toLowerCase()}.`}
      </p>
      <p className="mt-1 text-center text-xs text-slate-400">
        {Object.keys(placed).length}/{xs.length} points placed · grid spacing {yStep}
        {model.yUnit}
      </p>

      {!submitted && (
        <>
          <button
            type="button"
            disabled={!allPlaced}
            onClick={() => setSubmitted(true)}
            className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-medium text-white disabled:opacity-40"
          >
            Check Plot
          </button>
          {attempts >= 2 && feedback.hint && !showHint && (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="mt-3 text-sm text-amber-400 underline"
            >
              Show hint
            </button>
          )}
          {showHint && feedback.hint && (
            <FeedbackBanner message={feedback.hint} variant="hint" />
          )}
        </>
      )}

      {submitted && (
        <FeedbackBanner
          message={isCorrect ? feedback.correct : feedback.incorrect}
          variant={isCorrect ? "correct" : "incorrect"}
        />
      )}

      {submitted && isCorrect && (
        <button
          type="button"
          onClick={() => onComplete(true)}
          className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white"
        >
          Continue
        </button>
      )}

      {submitted && !isCorrect && (
        <button
          type="button"
          onClick={() => {
            onComplete(false);
            setPlaced({});
            setSubmitted(false);
          }}
          className="mt-4 w-full rounded-xl bg-slate-600 py-3 font-medium text-white"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pre-drawn curve (used by read questions)                            */
/* ------------------------------------------------------------------ */

function GraphChart({
  interaction,
  model,
}: {
  interaction: GraphInteraction;
  model: GraphModel;
}) {
  const pad = { l: 44, r: 16, t: 20, b: 36 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const sampleXs =
    interaction.graphType === "current-vs-resistance"
      ? [1, 2, 3, 4, 6, 8, 12]
      : [0, 3, 6, 9, 12, 15, 18];
  const points = sampleXs.map((x) => ({ x, y: model.compute(x) }));
  const xMin = model.xMin;
  const xMax = model.xMax;

  // Round the y-axis up to a clean maximum so the tick numbers read nicely.
  const yMaxRaw = Math.max(...points.map((p) => p.y), 1);
  const yStep = niceStep(yMaxRaw);
  const yMax = Math.ceil(yMaxRaw / yStep) * yStep || yStep;
  const yTicks = Array.from(
    { length: Math.round(yMax / yStep) + 1 },
    (_, i) => i * yStep
  );

  const fmt = (n: number) =>
    Number.isInteger(n) ? `${n}` : (Math.round(n * 100) / 100).toString();

  const toSvg = (x: number, y: number) => ({
    sx: pad.l + ((x - xMin) / (xMax - xMin)) * plotW,
    sy: pad.t + plotH - (y / yMax) * plotH,
  });

  const pathD = points
    .map((p, i) => {
      const { sx, sy } = toSvg(p.x, p.y);
      return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-900/80 p-3">
      <p className="mb-1 text-center text-xs text-slate-400">{model.note}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-sm">
        {/* horizontal gridlines + y-axis numbers */}
        {yTicks.map((ty) => {
          const { sy } = toSvg(xMin, ty);
          return (
            <g key={`y-${ty}`}>
              <line
                x1={pad.l}
                y1={sy}
                x2={pad.l + plotW}
                y2={sy}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text x={pad.l - 6} y={sy + 3} textAnchor="end" fill="#64748b" fontSize="9">
                {fmt(ty)}
              </text>
            </g>
          );
        })}

        {/* vertical gridlines + x-axis numbers at each sample point */}
        {sampleXs.map((x) => {
          const { sx } = toSvg(x, 0);
          return (
            <g key={`x-${x}`}>
              <line
                x1={sx}
                y1={pad.t}
                x2={sx}
                y2={pad.t + plotH}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text x={sx} y={pad.t + plotH + 14} textAnchor="middle" fill="#64748b" fontSize="9">
                {fmt(x)}
              </text>
            </g>
          );
        })}

        {/* axes */}
        <line x1={pad.l} y1={pad.t + plotH} x2={pad.l + plotW} y2={pad.t + plotH} stroke="#64748b" strokeWidth="2" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke="#64748b" strokeWidth="2" />
        <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
        {points.map((p) => {
          const { sx, sy } = toSvg(p.x, p.y);
          return <circle key={p.x} cx={sx} cy={sy} r={4} fill="#38bdf8" />;
        })}
        <text x={pad.l + plotW / 2} y={H - 4} textAnchor="middle" fill="#94a3b8" fontSize="11">
          {model.xLabel}
        </text>
        <text
          x={11}
          y={pad.t + plotH / 2}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          transform={`rotate(-90 11 ${pad.t + plotH / 2})`}
        >
          {model.yLabel}
        </text>
      </svg>
    </div>
  );
}

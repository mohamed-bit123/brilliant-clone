"use client";

import { useState } from "react";
import type { InteractionConfig } from "@/lib/types";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";

type GraphStepProps = {
  interaction: Extract<InteractionConfig, { kind: "graph" }>;
  feedback: { correct: string; incorrect: string; hint?: string };
  onComplete: (correct: boolean) => void;
  attempts: number;
};

export function GraphStep({
  interaction,
  feedback,
  onComplete,
  attempts,
}: GraphStepProps) {
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
      <GraphChart interaction={interaction} />

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
          <input
            type="number"
            step="any"
            value={numeric}
            onChange={(e) => setNumeric(e.target.value)}
            placeholder="Enter your answer"
            disabled={submitted && isCorrect}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-mono"
          />
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

function GraphChart({
  interaction,
}: {
  interaction: Extract<InteractionConfig, { kind: "graph" }>;
}) {
  const W = 320;
  const H = 200;
  const pad = { l: 44, r: 16, t: 20, b: 36 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  let xLabel = "";
  let yLabel = "";
  let points: { x: number; y: number }[] = [];
  let xMin = 0;
  let xMax = 10;
  let yMin = 0;
  let yMax = 10;

  if (interaction.graphType === "current-vs-resistance") {
    const V = interaction.fixedVoltage ?? 12;
    xLabel = "Resistance (Ω)";
    yLabel = "Current (A)";
    xMin = 1;
    xMax = 12;
    points = [1, 2, 3, 4, 6, 8, 12].map((r) => ({ x: r, y: V / r }));
    yMax = Math.max(...points.map((p) => p.y)) * 1.1;
  } else if (interaction.graphType === "current-vs-voltage") {
    const R = interaction.fixedResistance ?? 6;
    xLabel = "Voltage (V)";
    yLabel = "Current (A)";
    xMin = 0;
    xMax = 18;
    points = [0, 3, 6, 9, 12, 15, 18].map((v) => ({ x: v, y: v / R }));
    yMax = Math.max(...points.map((p) => p.y)) * 1.1;
  } else {
    const R = interaction.fixedResistance ?? 6;
    xLabel = "Voltage (V)";
    yLabel = "Power (W)";
    xMin = 0;
    xMax = 18;
    points = [0, 3, 6, 9, 12, 15, 18].map((v) => ({
      x: v,
      y: (v * v) / R,
    }));
    yMax = Math.max(...points.map((p) => p.y)) * 1.1;
  }

  const toSvg = (x: number, y: number) => ({
    sx: pad.l + ((x - xMin) / (xMax - xMin)) * plotW,
    sy: pad.t + plotH - ((y - yMin) / (yMax - yMin)) * plotH,
  });

  const pathD = points
    .map((p, i) => {
      const { sx, sy } = toSvg(p.x, p.y);
      return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
    })
    .join(" ");

  const note =
    interaction.graphType === "current-vs-resistance"
      ? `V = ${interaction.fixedVoltage ?? 12}V held constant`
      : `R = ${interaction.fixedResistance ?? 6}Ω held constant`;

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-900/80 p-3">
      <p className="mb-1 text-center text-xs text-slate-500">{note}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-sm">
        <line
          x1={pad.l}
          y1={pad.t + plotH}
          x2={pad.l + plotW}
          y2={pad.t + plotH}
          stroke="#64748b"
          strokeWidth="2"
        />
        <line
          x1={pad.l}
          y1={pad.t}
          x2={pad.l}
          y2={pad.t + plotH}
          stroke="#64748b"
          strokeWidth="2"
        />
        <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
        {points.map((p) => {
          const { sx, sy } = toSvg(p.x, p.y);
          return <circle key={p.x} cx={sx} cy={sy} r={4} fill="#38bdf8" />;
        })}
        <text
          x={pad.l + plotW / 2}
          y={H - 6}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
        >
          {xLabel}
        </text>
        <text
          x={12}
          y={pad.t + plotH / 2}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          transform={`rotate(-90 12 ${pad.t + plotH / 2})`}
        >
          {yLabel}
        </text>
      </svg>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  computeCurrent,
  computePower,
  parallelResistance,
  seriesResistance,
  type InteractionConfig,
} from "@/lib/types";
import { CircuitVisual } from "@/components/CircuitVisual";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import {
  pickNonMatchingCircuitConfig,
  pickNonMatchingDualSlider,
} from "@/lib/challenge-init";

type SliderStepProps = {
  interaction: Extract<InteractionConfig, { kind: "slider" }>;
  feedback: { correct: string; incorrect: string };
  onComplete: () => void;
};

export function SliderStep({ interaction, feedback, onComplete }: SliderStepProps) {
  const fixedV = interaction.fixedVoltage ?? 9;
  const fixedR = interaction.fixedResistance ?? 5;
  const [resistance, setResistance] = useState(interaction.initial ?? fixedR);
  const [voltage, setVoltage] = useState(interaction.initial ?? fixedV);

  const v = interaction.param === "resistance" ? fixedV : voltage;
  const r = interaction.param === "resistance" ? resistance : fixedR;

  return (
    <div>
      <CircuitVisual voltage={v} resistance={r} mode="simple" />
      <div className="mt-4">
        <label className="mb-2 block text-sm text-slate-300">
          {interaction.param === "resistance" ? "Resistance" : "Voltage"}:{" "}
          <span className="font-mono text-sky-400">
            {interaction.param === "resistance"
              ? `${resistance.toFixed(1)} Ω`
              : `${voltage.toFixed(1)} V`}
          </span>
        </label>
        <input
          type="range"
          min={interaction.min}
          max={interaction.max}
          step={0.5}
          value={interaction.param === "resistance" ? resistance : voltage}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (interaction.param === "resistance") setResistance(val);
            else setVoltage(val);
          }}
          className="w-full accent-sky-500"
        />
      </div>
      {interaction.observeOnly && (
        <>
          <FeedbackBanner message={feedback.correct} variant="neutral" />
          <button
            type="button"
            onClick={onComplete}
            className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-medium text-white hover:bg-sky-500"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}

type DualSliderStepProps = {
  interaction: Extract<InteractionConfig, { kind: "dual-slider" }>;
  feedback: { correct: string; incorrect: string; hint?: string };
  onComplete: (correct: boolean) => void;
  attempts: number;
  showPower?: boolean;
};

export function DualSliderStep({
  interaction,
  feedback,
  onComplete,
  attempts,
  showPower = false,
}: DualSliderStepProps) {
  const initialCircuit = pickNonMatchingDualSlider(interaction);
  const [voltage, setVoltage] = useState(initialCircuit.voltage);
  const [resistance, setResistance] = useState(initialCircuit.resistance);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const v = interaction.fixedVoltage ?? voltage;
  const current = computeCurrent(v, resistance);
  const power = computePower(v, current);
  const step = interaction.sliderStep ?? 0.5;
  const vMin = interaction.voltageMin ?? 1;
  const vMax = interaction.voltageMax ?? 24;
  const rMin = interaction.resistanceMin ?? 1;
  const rMax = interaction.resistanceMax ?? 30;

  const constraintChecks = interaction.constraints
    ? checkMultiConstraints(v, current, resistance, power, interaction.constraints)
    : null;

  let isCorrect = false;
  if (constraintChecks) {
    isCorrect = constraintChecks.allPass;
  } else if (interaction.targetCurrent !== undefined) {
    isCorrect =
      Math.abs(current - interaction.targetCurrent) <=
      (interaction.tolerance ?? 0.1);
  } else if (interaction.targetPower !== undefined) {
    isCorrect =
      Math.abs(power - interaction.targetPower) <= (interaction.tolerance ?? 0.3);
  } else if (interaction.observeOnly) {
    isCorrect = true;
  }

  function handleCheck() {
    setSubmitted(true);
  }

  const showPowerMeter =
    showPower || interaction.targetPower !== undefined || Boolean(interaction.constraints);

  return (
    <div>
      <CircuitVisual
        voltage={v}
        resistance={resistance}
        mode="simple"
        showPower={showPowerMeter}
      />

      {constraintChecks && (
        <ConstraintPanel checks={constraintChecks} constraints={interaction.constraints!} />
      )}

      <div className="mt-4 space-y-4">
        {!interaction.fixedVoltage && (
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Voltage: <span className="font-mono text-amber-400">{voltage.toFixed(1)} V</span>
            </label>
            <input
              type="range"
              min={vMin}
              max={vMax}
              step={step}
              value={voltage}
              onChange={(e) => setVoltage(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Resistance: <span className="font-mono text-emerald-400">{resistance.toFixed(1)} Ω</span>
          </label>
          <input
            type="range"
            min={rMin}
            max={rMax}
            step={step}
            value={resistance}
            onChange={(e) => setResistance(parseFloat(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>

      {!constraintChecks && interaction.targetCurrent !== undefined && (
        <p className="mt-3 text-center text-sm text-slate-400">
          Target: <span className="font-mono text-sky-300">{interaction.targetCurrent} A</span>
        </p>
      )}
      {!constraintChecks && interaction.targetPower !== undefined && (
        <p className="mt-3 text-center text-sm text-slate-400">
          Target: <span className="font-mono text-orange-300">{interaction.targetPower} W</span>
        </p>
      )}

      {!submitted && (
        <>
          <button
            type="button"
            onClick={() => {
              if (interaction.observeOnly) onComplete(true);
              else handleCheck();
            }}
            className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-medium text-white hover:bg-sky-500"
          >
            {interaction.observeOnly ? "Continue" : "Check Circuit"}
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
          message={
            isCorrect
              ? feedback.correct
              : constraintChecks
                ? `${feedback.incorrect} ${constraintChecks.summary}`
                : feedback.incorrect
          }
          variant={isCorrect ? "correct" : "incorrect"}
        />
      )}

      {submitted && isCorrect && (
        <button
          type="button"
          onClick={() => onComplete(true)}
          className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500"
        >
          Continue
        </button>
      )}

      {submitted && !isCorrect && !interaction.observeOnly && (
        <button
          type="button"
          onClick={() => {
            onComplete(false);
            setSubmitted(false);
          }}
          className="mt-4 w-full rounded-xl bg-slate-600 py-3 font-medium text-white hover:bg-slate-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

type ConstraintCheckResult = {
  voltage: boolean;
  current: boolean;
  resistance: boolean;
  power: boolean;
  allPass: boolean;
  summary: string;
};

function checkMultiConstraints(
  voltage: number,
  current: number,
  resistance: number,
  power: number,
  c: NonNullable<Extract<InteractionConfig, { kind: "dual-slider" }>["constraints"]>
): ConstraintCheckResult {
  const voltageOk =
    (c.voltageMin === undefined || voltage >= c.voltageMin) &&
    (c.voltageMax === undefined || voltage <= c.voltageMax);
  const currentOk =
    (c.currentMin === undefined || current >= c.currentMin) &&
    (c.currentMax === undefined || current <= c.currentMax);
  const resistanceOk =
    (c.resistanceMin === undefined || resistance >= c.resistanceMin) &&
    (c.resistanceMax === undefined || resistance <= c.resistanceMax);
  const powerOk = c.powerMax === undefined || power <= c.powerMax;

  const failed: string[] = [];
  if (!voltageOk) failed.push("voltage");
  if (!currentOk) failed.push("current");
  if (!resistanceOk) failed.push("resistance");
  if (!powerOk) failed.push("power");

  return {
    voltage: voltageOk,
    current: currentOk,
    resistance: resistanceOk,
    power: powerOk,
    allPass: voltageOk && currentOk && resistanceOk && powerOk,
    summary:
      failed.length > 0
        ? `Out of spec: ${failed.join(", ")}.`
        : "",
  };
}

function ConstraintPanel({
  checks,
  constraints: c,
}: {
  checks: ConstraintCheckResult;
  constraints: NonNullable<Extract<InteractionConfig, { kind: "dual-slider" }>["constraints"]>;
}) {
  return (
    <div className="mt-4 rounded-xl border border-slate-600 bg-slate-800/60 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        Lab spec sheet
      </p>
      <div className="space-y-2 text-sm">
        {(c.voltageMin !== undefined || c.voltageMax !== undefined) && (
          <ConstraintRow
            label="Voltage"
            spec={
              c.voltageMin !== undefined && c.voltageMax !== undefined
                ? `${c.voltageMin}V – ${c.voltageMax}V`
                : "—"
            }
            pass={checks.voltage}
          />
        )}
        <ConstraintRow
          label="Current"
          spec={
            c.currentMin !== undefined && c.currentMax !== undefined
              ? `${c.currentMin}A – ${c.currentMax}A`
              : "—"
          }
          pass={checks.current}
        />
        <ConstraintRow
          label="Resistance"
          spec={
            c.resistanceMin !== undefined && c.resistanceMax !== undefined
              ? `${c.resistanceMin}Ω – ${c.resistanceMax}Ω`
              : "—"
          }
          pass={checks.resistance}
        />
        <ConstraintRow
          label="Power"
          spec={c.powerMax !== undefined ? `≤ ${c.powerMax}W` : "—"}
          pass={checks.power}
        />
      </div>
    </div>
  );
}

function ConstraintRow({
  label,
  spec,
  pass,
}: {
  label: string;
  spec: string;
  pass: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-300">{label}</span>
      <span className="font-mono text-xs text-slate-400">{spec}</span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          pass ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
        }`}
      >
        {pass ? "in spec" : "out"}
      </span>
    </div>
  );
}

type SeriesParallelStepProps = {
  interaction:
    | Extract<InteractionConfig, { kind: "series-sliders" }>
    | Extract<InteractionConfig, { kind: "parallel-sliders" }>;
  feedback: { correct: string; incorrect: string };
  onComplete: () => void;
};

export function SeriesParallelStep({
  interaction,
  feedback,
  onComplete,
}: SeriesParallelStepProps) {
  const [r1, setR1] = useState(interaction.initialR1 ?? 4);
  const [r2, setR2] = useState(interaction.initialR2 ?? 4);
  const mode = interaction.kind === "series-sliders" ? "series" : "parallel";
  const totalR =
    mode === "series"
      ? seriesResistance(r1, r2)
      : parallelResistance(r1, r2);

  return (
    <div>
      <CircuitVisual
        voltage={interaction.fixedVoltage}
        resistance={totalR}
        r1={r1}
        r2={r2}
        mode={mode}
      />
      <div className="mt-4 space-y-4">
        <SliderControl label="R₁" value={r1} range={interaction.r1Range} onChange={setR1} color="accent-pink-500" />
        <SliderControl label="R₂" value={r2} range={interaction.r2Range} onChange={setR2} color="accent-violet-500" />
      </div>
      <p className="mt-2 text-center text-sm text-slate-400">
        R_total = <span className="font-mono text-emerald-300">{totalR.toFixed(2)} Ω</span>
      </p>
      <FeedbackBanner message={feedback.correct} variant="neutral" />
      <button
        type="button"
        onClick={onComplete}
        className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-medium text-white hover:bg-sky-500"
      >
        Continue
      </button>
    </div>
  );
}

function SliderControl({
  label,
  value,
  range,
  onChange,
  color,
}: {
  label: string;
  value: number;
  range: [number, number];
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">
        {label}: <span className="font-mono">{value.toFixed(1)} Ω</span>
      </label>
      <input
        type="range"
        min={range[0]}
        max={range[1]}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full ${color}`}
      />
    </div>
  );
}

type CircuitConfigStepProps = {
  interaction: Extract<InteractionConfig, { kind: "circuit-config" }>;
  feedback: { correct: string; incorrect: string; hint?: string };
  onComplete: (correct: boolean) => void;
  attempts: number;
};

export function CircuitConfigStep({
  interaction,
  feedback,
  onComplete,
  attempts,
}: CircuitConfigStepProps) {
  const initialBranches = pickNonMatchingCircuitConfig(interaction);
  const [r1, setR1] = useState(initialBranches.r1);
  const [r2, setR2] = useState(initialBranches.r2);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const totalR =
    interaction.mode === "series"
      ? seriesResistance(r1, r2)
      : parallelResistance(r1, r2);
  const current = computeCurrent(interaction.fixedVoltage, totalR);
  const power = computePower(interaction.fixedVoltage, current);

  let isCorrect = false;
  if (interaction.targetCurrent !== undefined) {
    isCorrect =
      Math.abs(current - interaction.targetCurrent) <= (interaction.tolerance ?? 0.1);
  } else if (interaction.targetResistance !== undefined) {
    isCorrect =
      Math.abs(totalR - interaction.targetResistance) <= (interaction.tolerance ?? 0.2);
  } else if (interaction.targetPower !== undefined) {
    isCorrect =
      Math.abs(power - interaction.targetPower) <= (interaction.tolerance ?? 0.3);
  }

  const mode = interaction.mode === "simple" ? "simple" : interaction.mode;

  return (
    <div>
      <CircuitVisual
        voltage={interaction.fixedVoltage}
        resistance={totalR}
        r1={r1}
        r2={r2}
        mode={mode as "simple" | "series" | "parallel"}
        showPower={interaction.targetPower !== undefined}
      />
      {interaction.mode !== "simple" && (
        <div className="mt-4 space-y-4">
          <SliderControl label="R₁" value={r1} range={[1, 20]} onChange={setR1} color="accent-pink-500" />
          <SliderControl label="R₂" value={r2} range={[1, 20]} onChange={setR2} color="accent-violet-500" />
        </div>
      )}
      {interaction.targetCurrent !== undefined && (
        <p className="mt-3 text-center text-sm">
          Target current: <span className="font-mono text-sky-300">{interaction.targetCurrent} A</span>
        </p>
      )}

      {!submitted && (
        <>
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-medium text-white hover:bg-sky-500"
          >
            Check Circuit
          </button>
          {attempts >= 2 && feedback.hint && !showHint && (
            <button type="button" onClick={() => setShowHint(true)} className="mt-3 text-sm text-amber-400 underline">
              Show hint
            </button>
          )}
          {showHint && feedback.hint && <FeedbackBanner message={feedback.hint} variant="hint" />}
        </>
      )}

      {submitted && (
        <FeedbackBanner
          message={isCorrect ? feedback.correct : feedback.incorrect}
          variant={isCorrect ? "correct" : "incorrect"}
        />
      )}

      {submitted && isCorrect && (
        <button type="button" onClick={() => onComplete(true)} className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500">
          Continue
        </button>
      )}

      {submitted && !isCorrect && (
        <button type="button" onClick={() => { onComplete(false); setSubmitted(false); }} className="mt-4 w-full rounded-xl bg-slate-600 py-3 font-medium text-white hover:bg-slate-500">
          Try Again
        </button>
      )}
    </div>
  );
}

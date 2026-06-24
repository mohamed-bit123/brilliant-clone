"use client";

import { useState } from "react";
import type { MasteryQuestion } from "@/lib/types";
import { computeCurrent } from "@/lib/types";
import { pickNonMatchingSimpleCircuit } from "@/lib/challenge-init";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { CircuitVisual } from "@/components/CircuitVisual";

type MasteryStepProps = {
  questions: MasteryQuestion[];
  feedback: { correct: string; incorrect: string };
  masteryThreshold: number;
  onComplete: (score: number) => void;
};

export function MasteryStep({
  questions,
  feedback,
  masteryThreshold,
  onComplete,
}: MasteryStepProps) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  function recordResult(correct: boolean) {
    const next = [...results, correct];
    setResults(next);
    if (index + 1 >= questions.length) {
      const score = next.filter(Boolean).length / questions.length;
      setFinished(true);
      onComplete(score);
    } else {
      setIndex(index + 1);
    }
  }

  if (finished) {
    const correctCount = results.filter(Boolean).length;
    const passed = correctCount / questions.length >= masteryThreshold;
    return (
      <div className="text-center">
        <div className="text-4xl">{passed ? "🎉" : "📚"}</div>
        <h3 className="mt-2 text-xl font-semibold">
          {correctCount} of {questions.length} correct
        </h3>
        <FeedbackBanner
          message={passed ? feedback.correct : feedback.incorrect}
          variant={passed ? "correct" : "incorrect"}
        />
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">
        Question {index + 1} of {questions.length}
      </p>
      <p className="mb-4 font-medium">{q.prompt}</p>

      {q.kind === "mcq" && q.options && (
        <McqQuestion key={q.id} question={q} onAnswer={recordResult} />
      )}
      {q.kind === "numeric" && (
        <NumericQuestion key={q.id} question={q} onAnswer={recordResult} />
      )}
      {q.kind === "config" && (
        <ConfigQuestion key={q.id} question={q} onAnswer={recordResult} />
      )}
    </div>
  );
}

function McqQuestion({
  question,
  onAnswer,
}: {
  question: MasteryQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div>
      {question.options!.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => setSelected(i)}
          className={`mb-2 w-full rounded-xl border px-4 py-3 text-left text-sm ${
            selected === i ? "border-sky-500 bg-sky-950/50" : "border-slate-600 bg-slate-800/50"
          }`}
        >
          {opt}
        </button>
      ))}
      <button
        type="button"
        disabled={selected === null}
        onClick={() => onAnswer(selected === question.correctIndex)}
        className="mt-2 w-full rounded-xl bg-sky-600 py-3 font-medium text-white disabled:opacity-40"
      >
        Submit
      </button>
    </div>
  );
}

function NumericQuestion({
  question,
  onAnswer,
}: {
  question: MasteryQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [value, setValue] = useState("");

  function check() {
    const num = parseFloat(value);
    const target = question.correctAnswer as number;
    const tol = question.tolerance ?? 0.1;
    onAnswer(Math.abs(num - target) <= tol);
  }

  return (
    <div>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter value"
        className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-mono"
      />
      <button type="button" onClick={check} className="mt-3 w-full rounded-xl bg-sky-600 py-3 font-medium text-white">
        Submit
      </button>
    </div>
  );
}

function ConfigQuestion({
  question,
  onAnswer,
}: {
  question: MasteryQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const target = question.configTarget?.current ?? 4;
  const tol = question.tolerance ?? 0.1;
  const initial = pickNonMatchingSimpleCircuit(
    {
      current: question.configTarget?.current,
      power: question.configTarget?.power,
      tolerance: tol,
    },
    { initialVoltage: 12, initialResistance: 5 }
  );
  const [voltage, setVoltage] = useState(initial.voltage);
  const [resistance, setResistance] = useState(initial.resistance);
  const current = computeCurrent(voltage, resistance);

  return (
    <div>
      <CircuitVisual voltage={voltage} resistance={resistance} mode="simple" compact />
      <div className="mt-3 space-y-3">
        <div>
          <label className="text-xs text-slate-400">Voltage: {voltage.toFixed(1)}V</label>
          <input type="range" min={1} max={24} step={0.5} value={voltage} onChange={(e) => setVoltage(parseFloat(e.target.value))} className="w-full accent-amber-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Resistance: {resistance.toFixed(1)}Ω</label>
          <input type="range" min={1} max={20} step={0.5} value={resistance} onChange={(e) => setResistance(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
        </div>
      </div>
      <p className="mt-2 text-center text-sm">Current: <span className="font-mono text-sky-300">{current.toFixed(2)}A</span> · Target: {target}A</p>
      <button
        type="button"
        onClick={() => onAnswer(Math.abs(current - target) <= tol)}
        className="mt-3 w-full rounded-xl bg-sky-600 py-3 font-medium text-white"
      >
        Check Circuit
      </button>
    </div>
  );
}

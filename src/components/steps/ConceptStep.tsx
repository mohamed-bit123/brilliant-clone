"use client";

import type { InteractionConfig } from "@/lib/types";
import { CircuitVisual, previewResistance } from "@/components/CircuitVisual";
import { MultiSourceVisual } from "@/components/MultiSourceVisual";

type ConceptStepProps = {
  interaction: Extract<InteractionConfig, { kind: "concept" }>;
  onComplete: () => void;
};

export function ConceptStep({ interaction, onComplete }: ConceptStepProps) {
  const { sections, analogy, formula, visual, multiSource, keyPoints } = interaction;

  return (
    <div className="space-y-5">
      {multiSource && <MultiSourceVisual config={multiSource} />}
      {visual && (
        <CircuitVisual
          mode={visual.mode}
          voltage={visual.voltage}
          resistance={previewResistance(visual)}
          r1={visual.r1}
          r2={visual.r2}
        />
      )}

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.heading}>
            <h3 className="text-sm font-semibold text-sky-300">{section.heading}</h3>
            <p className="mt-1 leading-relaxed text-slate-300">{section.body}</p>
          </div>
        ))}
      </div>

      {formula && (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/30 p-4 text-center">
          <p className="font-mono text-2xl font-semibold text-sky-200">
            {formula.expression}
          </p>
          {formula.caption && (
            <p className="mt-2 text-xs text-slate-400">{formula.caption}</p>
          )}
        </div>
      )}

      {analogy && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
            {analogy.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-100/90">
            {analogy.body}
          </p>
        </div>
      )}

      {keyPoints && keyPoints.length > 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Key takeaways
          </p>
          <ul className="space-y-2">
            {keyPoints.map((point) => (
              <li key={point} className="flex gap-2 text-sm text-slate-300">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onComplete}
        className="w-full rounded-xl bg-sky-600 py-3 font-medium text-white hover:bg-sky-500"
      >
        {interaction.continueLabel ?? "Start Learning"}
      </button>
    </div>
  );
}

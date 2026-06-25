"use client";

import { solveMultiSource, type MultiSourceConfig } from "@/lib/types";

type MultiSourceVisualProps = {
  config: MultiSourceConfig;
  /** Quiz mode hides the computed metrics panel so it can't reveal answers. */
  quiz?: boolean;
};

const WIRE = "#94a3b8";

/**
 * Schematic for a one- or two-source single-loop circuit. Sources sit on the
 * top edge (series) or stacked on the left (parallel); the load is on the
 * right edge. Numbers shown on the diagram (EMFs, internal resistances, load)
 * are always the *givens*; computed values live in the metrics panel, which is
 * hidden in quiz mode.
 */
export function MultiSourceVisual({ config, quiz = false }: MultiSourceVisualProps) {
  const { arrangement, e1, e2, r1, r2, load } = config;
  const sol = solveMultiSource(config);
  const hasTwo = arrangement !== "single";
  const showCurrent = sol.current > 0 && config.mask !== "current";

  const loadLabel = load && load > 0 ? `${fmt(load)} Ω` : "—";

  return (
    <div className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
      {arrangement === "parallel" ? (
        <ParallelDiagram e1={e1} e2={e2} r1={r1} r2={r2} loadLabel={loadLabel} flow={showCurrent} />
      ) : (
        <SeriesDiagram
          single={!hasTwo}
          opposing={arrangement === "series-opposing"}
          e1={e1}
          e2={e2}
          r1={r1}
          r2={r2}
          loadLabel={loadLabel}
          flow={showCurrent}
        />
      )}

      {!quiz && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <Metric
            label="Net EMF"
            value={config.mask === "netEmf" ? "? V" : `${fmt(sol.netEmf)} V`}
            color="text-amber-400"
          />
          <Metric
            label="Loop current"
            value={config.mask === "current" ? "? A" : `${fmt(sol.current)} A`}
            color="text-sky-400"
          />
          <Metric
            label="Voltage across R"
            value={config.mask === "terminal" ? "? V" : `${fmt(sol.terminalVoltage)} V`}
            color="text-emerald-400"
          />
        </div>
      )}
    </div>
  );
}

function fmt(n: number): string {
  return Number.isInteger(n) ? `${n}` : `${Math.round(n * 100) / 100}`;
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-slate-800/80 px-2 py-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`font-mono font-semibold ${color}`}>{value}</div>
    </div>
  );
}

/** A battery/cell glyph centered at (cx, cy) on a horizontal wire. */
function CellH({
  cx,
  cy,
  label,
  rLabel,
  flipped = false,
}: {
  cx: number;
  cy: number;
  label: string;
  rLabel?: string;
  flipped?: boolean;
}) {
  // Long plate = + terminal, short thick plate = − terminal.
  const longX = flipped ? cx - 7 : cx + 7;
  const shortX = flipped ? cx + 7 : cx - 7;
  return (
    <g>
      <line x1={longX} y1={cy - 16} x2={longX} y2={cy + 16} stroke="#e2e8f0" strokeWidth="2" />
      <line x1={shortX} y1={cy - 8} x2={shortX} y2={cy + 8} stroke="#e2e8f0" strokeWidth="5" />
      <text x={cx} y={cy - 24} textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">
        {label}
      </text>
      {rLabel && (
        <text x={cx} y={cy + 32} textAnchor="middle" fill="#fda4af" fontSize="10">
          {rLabel}
        </text>
      )}
    </g>
  );
}

/** A resistor zig-zag drawn vertically, centered at (cx, cy). */
function ResistorV({ cx, cy, label }: { cx: number; cy: number; label: string }) {
  const top = cy - 28;
  const d = `M ${cx},${top} l 8,8 l -16,12 l 16,12 l -16,12 l 8,8`;
  return (
    <g>
      <path d={d} fill="none" stroke="#f472b6" strokeWidth="2.5" />
      <text x={cx + 16} y={cy + 4} fill="#fda4af" fontSize="12" fontWeight="bold">
        {label}
      </text>
    </g>
  );
}

function FlowArrow({ x, y, dir }: { x: number; y: number; dir: "left" | "right" | "up" | "down" }) {
  const pts =
    dir === "right"
      ? `${x},${y - 5} ${x + 9},${y} ${x},${y + 5}`
      : dir === "left"
        ? `${x},${y - 5} ${x - 9},${y} ${x},${y + 5}`
        : dir === "down"
          ? `${x - 5},${y} ${x + 5},${y} ${x},${y + 9}`
          : `${x - 5},${y} ${x + 5},${y} ${x},${y - 9}`;
  return <polygon points={pts} fill="#38bdf8" />;
}

function SeriesDiagram({
  single,
  opposing,
  e1,
  e2,
  r1,
  r2,
  loadLabel,
  flow,
}: {
  single: boolean;
  opposing: boolean;
  e1: number;
  e2?: number;
  r1?: number;
  r2?: number;
  loadLabel: string;
  flow: boolean;
}) {
  const L = 40;
  const R = 360;
  const T = 60;
  const B = 190;
  return (
    <svg viewBox="0 0 400 230" className="w-full" style={{ height: 210 }} aria-label="Circuit diagram">
      {/* Loop wires */}
      <line x1={L} y1={T} x2={R} y2={T} stroke={WIRE} strokeWidth="3" />
      <line x1={R} y1={T} x2={R} y2={B} stroke={WIRE} strokeWidth="3" />
      <line x1={R} y1={B} x2={L} y2={B} stroke={WIRE} strokeWidth="3" />
      <line x1={L} y1={B} x2={L} y2={T} stroke={WIRE} strokeWidth="3" />

      {/* Source(s) on the top wire */}
      {single ? (
        <CellH cx={200} cy={T} label={`ε = ${fmt(e1)} V`} rLabel={r1 ? `r = ${fmt(r1)} Ω` : undefined} />
      ) : (
        <>
          <CellH cx={140} cy={T} label={`ε₁ = ${fmt(e1)} V`} rLabel={r1 ? `r₁ = ${fmt(r1)} Ω` : undefined} />
          <CellH
            cx={250}
            cy={T}
            label={`ε₂ = ${fmt(e2 ?? 0)} V`}
            rLabel={r2 ? `r₂ = ${fmt(r2)} Ω` : undefined}
            flipped={opposing}
          />
        </>
      )}

      {/* Load resistor on the right wire */}
      <ResistorV cx={R} cy={(T + B) / 2} label={`R = ${loadLabel}`} />

      {/* Conventional current direction (out of + terminal, clockwise here) */}
      {flow && (
        <>
          <FlowArrow x={R} y={(T + B) / 2 + 30} dir="down" />
          <FlowArrow x={(L + R) / 2} y={B} dir="left" />
          <FlowArrow x={L} y={(T + B) / 2} dir="up" />
        </>
      )}

      {opposing && (
        <text x={200} y={222} textAnchor="middle" fill="#94a3b8" fontSize="10">
          ε₂ opposes ε₁ (e.g. charging) — net EMF subtracts
        </text>
      )}
    </svg>
  );
}

function ParallelDiagram({
  e1,
  e2,
  r1,
  r2,
  loadLabel,
  flow,
}: {
  e1: number;
  e2?: number;
  r1?: number;
  r2?: number;
  loadLabel: string;
  flow: boolean;
}) {
  const R = 360;
  return (
    <svg viewBox="0 0 400 230" className="w-full" style={{ height: 210 }} aria-label="Circuit diagram">
      {/* Two stacked cells on the left, commoned top and bottom rails */}
      {/* Top rail */}
      <line x1={70} y1={50} x2={R} y2={50} stroke={WIRE} strokeWidth="3" />
      {/* Bottom rail */}
      <line x1={70} y1={190} x2={R} y2={190} stroke={WIRE} strokeWidth="3" />
      {/* Right wire (load side) */}
      <line x1={R} y1={50} x2={R} y2={190} stroke={WIRE} strokeWidth="3" />

      {/* Branch 1 (upper) cell */}
      <line x1={70} y1={50} x2={70} y2={95} stroke={WIRE} strokeWidth="3" />
      <line x1={130} y1={50} x2={130} y2={95} stroke={WIRE} strokeWidth="3" />
      <line x1={70} y1={95} x2={130} y2={95} stroke={WIRE} strokeWidth="3" />
      <CellH cx={100} cy={95} label={`ε₁ = ${fmt(e1)} V`} rLabel={r1 ? `r₁ = ${fmt(r1)} Ω` : undefined} />

      {/* Branch 2 (lower) cell */}
      <line x1={70} y1={190} x2={70} y2={145} stroke={WIRE} strokeWidth="3" />
      <line x1={130} y1={190} x2={130} y2={145} stroke={WIRE} strokeWidth="3" />
      <line x1={70} y1={145} x2={130} y2={145} stroke={WIRE} strokeWidth="3" />
      <CellH cx={100} cy={145} label={`ε₂ = ${fmt(e2 ?? e1)} V`} rLabel={r2 ? `r₂ = ${fmt(r2)} Ω` : undefined} />

      {/* common vertical between the two branch tops/bottoms */}
      <line x1={130} y1={50} x2={200} y2={50} stroke={WIRE} strokeWidth="3" />
      <line x1={130} y1={190} x2={200} y2={190} stroke={WIRE} strokeWidth="3" />

      {/* Load resistor on the right wire */}
      <ResistorV cx={R} cy={120} label={`R = ${loadLabel}`} />

      {flow && (
        <>
          <FlowArrow x={R} y={150} dir="down" />
          <FlowArrow x={250} y={50} dir="right" />
        </>
      )}

      <text x={150} y={222} textAnchor="middle" fill="#94a3b8" fontSize="10">
        Equal EMFs in parallel: same voltage, internal resistances combine lower
      </text>
    </svg>
  );
}

"use client";

import { computeCurrent, computePower, parallelResistance } from "@/lib/types";

type CircuitVisualProps = {
  voltage: number;
  resistance: number;
  r1?: number;
  r2?: number;
  mode?: "simple" | "series" | "parallel";
  showPower?: boolean;
  compact?: boolean;
  /** Hide computed values the learner is solving for in calc steps */
  maskSolveFor?: "current" | "voltage" | "resistance" | "power" | "rTotal" | "branchCurrent";
  maskBranchIndex?: 1 | 2;
  /** Show "?" for a specific resistor's value (a given the learner must find). */
  maskResistor?: 1 | 2;
  /** Quiz mode: hide the computed metrics panel and branch readouts so the
   *  diagram can't reveal the answer. Used by practice/calc questions. */
  quiz?: boolean;
};

export function CircuitVisual({
  voltage,
  resistance,
  r1,
  r2,
  mode = "simple",
  showPower = false,
  compact = false,
  maskSolveFor,
  maskBranchIndex = 1,
  maskResistor,
  quiz = false,
}: CircuitVisualProps) {
  const r1Label = maskResistor === 1 ? "?" : (r1 ?? 0).toFixed(1);
  const r2Label = maskResistor === 2 ? "?" : (r2 ?? 0).toFixed(1);
  const current = computeCurrent(voltage, resistance);
  const power = computePower(voltage, current);
  const hideCurrent = maskSolveFor === "current" || maskSolveFor === "branchCurrent";
  const hideVoltage = maskSolveFor === "voltage";
  const hideResistance = maskSolveFor === "resistance" || maskSolveFor === "rTotal";
  const hidePower = maskSolveFor === "power";
  // Current always flows visibly through the circuit (it doesn't reveal the
  // numeric answer — the I/V/R *values* are masked separately below). This keeps
  // the diagram physically honest: e.g. both parallel branches always animate.
  const brightness = Math.min(1, current / 5);
  const electronSpeed = Math.max(0.5, Math.min(3, current / 2));
  const heatLevel = Math.min(1, power / 30);

  const branch1R = r1 ?? 4;
  const branch2R = r2 ?? 8;
  const i1 = mode === "parallel" ? computeCurrent(voltage, branch1R) : 0;
  const i2 = mode === "parallel" ? computeCurrent(voltage, branch2R) : 0;
  const iTotal = mode === "parallel" ? i1 + i2 : current;
  const speed1 = Math.max(0.35, Math.min(4, i1 / 1.2));
  const speed2 = Math.max(0.35, Math.min(4, i2 / 1.2));
  const dots1 = Math.max(1, Math.min(5, Math.round(i1 / 1.5)));
  const dots2 = Math.max(1, Math.min(5, Math.round(i2 / 1.5)));
  const speedTotal = Math.max(0.35, Math.min(4, iTotal / 1.2));
  const dotsTotal = Math.max(2, Math.min(6, Math.round(iTotal / 1.5)));

  const height = compact ? 180 : mode === "parallel" ? 240 : 220;

  return (
    <div className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
      <svg
        viewBox={mode === "parallel" ? "0 0 400 210" : "0 0 400 220"}
        className="w-full"
        style={{ height }}
        aria-label="Circuit diagram"
      >
        {/* Battery — y=105 aligns with junction for parallel mode */}
        <g transform="translate(30, 70)">
          <rect x="0" y="20" width="40" height="60" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <text x="20" y="55" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="bold">
            {hideVoltage ? "?V" : `${voltage.toFixed(0)}V`}
          </text>
          <line x1="40" y1="35" x2="70" y2="35" stroke="#94a3b8" strokeWidth="3" />
        </g>

        {mode === "simple" && (
          <>
            <Wire x1={70} y1={105} x2={130} y2={105} />
            <Resistor x={130} y={90} label={hideResistance ? "?Ω" : `${resistance.toFixed(1)}Ω`} />
            <Wire x1={190} y1={105} x2={230} y2={105} />
            <Bulb x={230} y={80} brightness={brightness} />
            <Wire x1={290} y1={105} x2={340} y2={105} />
            <Wire x1={340} y1={105} x2={340} y2={175} />
            <Wire x1={340} y1={175} x2={30} y2={175} />
            <Wire x1={30} y1={175} x2={30} y2={120} />
            <ElectronFlow
              path="M 70,105 L 130,105 L 190,105 L 230,105 L 290,105 L 340,105 L 340,175 L 30,175 L 30,120"
              speed={electronSpeed}
              count={3}
            />
          </>
        )}

        {mode === "series" && r1 !== undefined && r2 !== undefined && (
          <>
            <Wire x1={70} y1={105} x2={110} y2={105} />
            <Resistor x={110} y={90} label={`R₁ ${r1Label}Ω`} />
            <Wire x1={170} y1={105} x2={200} y2={105} />
            <Resistor x={200} y={90} label={`R₂ ${r2Label}Ω`} />
            <Wire x1={260} y1={105} x2={290} y2={105} />
            <Bulb x={290} y={80} brightness={brightness} />
            <Wire x1={350} y1={105} x2={355} y2={105} />
            <Wire x1={355} y1={105} x2={355} y2={175} />
            <Wire x1={355} y1={175} x2={30} y2={175} />
            <Wire x1={30} y1={175} x2={30} y2={120} />
            <ElectronFlow
              path="M 70,105 L 170,105 L 260,105 L 350,105 L 355,105 L 355,175 L 30,175 L 30,120"
              speed={electronSpeed}
              count={3}
            />
          </>
        )}

        {mode === "parallel" && (
          <>
            {/* Feed from battery to junction */}
            <Wire x1={70} y1={105} x2={110} y2={105} />
            <ElectronFlow
              path="M 70,105 L 110,105"
              speed={speedTotal}
              count={dotsTotal}
              color="#fbbf24"
            />
            <circle cx={110} cy={105} r={5} fill="#38bdf8" />
            <text x={82} y={98} fill="#94a3b8" fontSize="10">split</text>

            {/* Branch A (top) */}
            <text x={14} y={58} fill="#38bdf8" fontSize="11" fontWeight="bold">
              Branch A
            </text>
            <Wire x1={110} y1={105} x2={110} y2={55} />
            <Wire x1={110} y1={55} x2={145} y2={55} />
            <ElectronFlow
              path="M 110,105 L 110,55 L 190,55 L 270,55 L 270,105"
              speed={speed1}
              count={dots1}
              color="#38bdf8"
            />
            <Resistor x={145} y={42} label={`R₁ ${r1 !== undefined ? r1Label : branch1R.toFixed(1)}Ω`} width={45} labelBelow />
            <Wire x1={190} y1={55} x2={270} y2={55} />
            {!quiz && (
              <text x={198} y={48} fill="#7dd3fc" fontSize="10" fontWeight="bold">
                I₁={hideCurrent && (maskSolveFor !== "branchCurrent" || maskBranchIndex === 1) ? "?" : i1.toFixed(2)}A
              </text>
            )}

            {/* Branch B (bottom) */}
            <text x={14} y={158} fill="#c084fc" fontSize="11" fontWeight="bold">
              Branch B
            </text>
            <Wire x1={110} y1={105} x2={110} y2={155} />
            <Wire x1={110} y1={155} x2={145} y2={155} />
            <ElectronFlow
              path="M 110,105 L 110,155 L 190,155 L 270,155 L 270,105"
              speed={speed2}
              count={dots2}
              color="#c084fc"
            />
            <Resistor x={145} y={142} label={`R₂ ${r2 !== undefined ? r2Label : branch2R.toFixed(1)}Ω`} width={45} labelBelow />
            <Wire x1={190} y1={155} x2={270} y2={155} />
            {!quiz && (
              <text x={198} y={148} fill="#d8b4fe" fontSize="10" fontWeight="bold">
                I₂={hideCurrent && maskSolveFor === "branchCurrent" && maskBranchIndex === 2 ? "?" : i2.toFixed(2)}A
              </text>
            )}

            {/* Rejoin → bulb → return to battery */}
            <Wire x1={270} y1={55} x2={270} y2={155} />
            <circle cx={270} cy={105} r={5} fill="#38bdf8" />
            <Wire x1={270} y1={105} x2={305} y2={105} />
            <ElectronFlow
              path="M 270,105 L 355,105"
              speed={speedTotal}
              count={dotsTotal}
              color="#fbbf24"
            />
            <text x={274} y={98} fill="#94a3b8" fontSize="10">join</text>
            <Bulb x={305} y={80} brightness={Math.min(1, iTotal / 5)} />
            <Wire x1={365} y1={105} x2={355} y2={105} />
            {/* Return path along top edge back to battery */}
            <Wire x1={355} y1={105} x2={355} y2={28} />
            <Wire x1={355} y1={28} x2={20} y2={28} />
            <Wire x1={20} y1={28} x2={20} y2={90} />
            <Wire x1={20} y1={90} x2={30} y2={90} />
            <ElectronFlow
              path="M 355,105 L 355,28 L 20,28 L 20,90 L 30,90"
              speed={speedTotal}
              count={dotsTotal}
              color="#fbbf24"
            />
            <text x={168} y={22} fill="#94a3b8" fontSize="9">return to battery</text>
          </>
        )}
      </svg>

      {quiz ? null : mode === "parallel" ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-4">
          <Metric
            label="Voltage (both branches)"
            value={hideVoltage ? "? V" : `${voltage.toFixed(1)} V`}
            color="text-amber-400"
          />
          <Metric
            label="I₁ Branch A"
            value={
              hideCurrent && (maskSolveFor !== "branchCurrent" || maskBranchIndex === 1)
                ? "? A"
                : `${i1.toFixed(2)} A`
            }
            color="text-sky-400"
          />
          <Metric
            label="I₂ Branch B"
            value={
              hideCurrent && maskSolveFor === "branchCurrent" && maskBranchIndex === 2
                ? "? A"
                : `${i2.toFixed(2)} A`
            }
            color="text-violet-400"
          />
          <Metric
            label="I_total"
            value={hideCurrent ? "? A" : `${iTotal.toFixed(2)} A`}
            color="text-emerald-400"
          />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <Metric
            label="Voltage"
            value={hideVoltage ? "? V" : `${voltage.toFixed(1)} V`}
            color="text-amber-400"
          />
          <Metric
            label="Current"
            value={hideCurrent ? "? A" : `${current.toFixed(2)} A`}
            color="text-sky-400"
          />
          <Metric
            label={showPower ? "Power" : "Resistance"}
            value={
              showPower
                ? hidePower
                  ? "? W"
                  : `${power.toFixed(1)} W`
                : hideResistance
                  ? "? Ω"
                  : `${resistance.toFixed(1)} Ω`
            }
            color={showPower ? "text-orange-400" : "text-emerald-400"}
          />
        </div>
      )}

      {mode === "parallel" && (
        <p className="mt-2 text-center text-xs text-slate-500">
          Blue/purple dots = each branch · Gold dots = total current (feed & return path)
        </p>
      )}

      {showPower && mode !== "parallel" && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-75"
            style={{ width: `${heatLevel * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-slate-800/80 px-2 py-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`font-mono font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Wire({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="3" />;
}

function Resistor({
  x,
  y,
  label,
  width = 60,
  labelBelow = true,
}: {
  x: number;
  y: number;
  label: string;
  width?: number;
  labelBelow?: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {labelBelow && (
        <text x={width / 2} y={-4} textAnchor="middle" fill="#fda4af" fontSize="10">
          {label}
        </text>
      )}
      <path
        d={`M 0,15 L 10,0 L 20,30 L 30,0 L 40,30 L 50,0 L ${width},15`}
        fill="none"
        stroke="#f472b6"
        strokeWidth="2.5"
      />
      {!labelBelow && (
        <text x={width / 2} y={48} textAnchor="middle" fill="#fda4af" fontSize="11">
          {label}
        </text>
      )}
    </g>
  );
}

function Bulb({ x, y, brightness }: { x: number; y: number; brightness: number }) {
  const glow = 0.2 + brightness * 0.8;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={25} cy={25} r={22 + brightness * 8} fill={`rgba(251,191,36,${glow * 0.3})`} />
      <circle cx={25} cy={25} r={18} fill={`rgba(251,191,36,${0.3 + brightness * 0.7})`} stroke="#fbbf24" strokeWidth="2" />
      <path d="M 15,40 Q 25,35 35,40" fill="none" stroke="#94a3b8" strokeWidth="2" />
    </g>
  );
}

function ElectronFlow({
  path,
  speed,
  count = 3,
  color = "#38bdf8",
}: {
  path: string;
  speed: number;
  count?: number;
  color?: string;
}) {
  if (count <= 0) return null;
  const duration = 3 / speed;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} r="4" fill={color}>
          <animateMotion
            dur={`${duration}s`}
            repeatCount="indefinite"
            path={path}
            begin={`${(i * duration) / count}s`}
          />
        </circle>
      ))}
    </>
  );
}

export function previewResistance(preview: {
  mode: "simple" | "series" | "parallel";
  voltage: number;
  resistance?: number;
  r1?: number;
  r2?: number;
}): number {
  if (preview.mode === "parallel" && preview.r1 && preview.r2) {
    return parallelResistance(preview.r1, preview.r2);
  }
  if (preview.mode === "series" && preview.r1 && preview.r2) {
    return preview.r1 + preview.r2;
  }
  return preview.resistance ?? 5;
}

"use client";

import { type JSX } from "react";
import {
  solveNetwork,
  type NetworkNode,
  type NetworkSpec,
} from "@/lib/network";

type NetworkVisualProps = {
  spec: NetworkSpec;
  /** Quiz mode hides computed readings so the diagram can't reveal answers. */
  quiz?: boolean;
};

const RES_W = 70;
const RES_H = 38;
const H_GAP = 26; // wire between series parts
const V_GAP = 26; // vertical spacing between parallel branches
const BUS = 20; // horizontal stub length on each side of a parallel block
const WIRE = "#94a3b8";

type Box = { w: number; h: number };

function measure(node: NetworkNode): Box {
  if (node.kind === "resistor") return { w: RES_W, h: RES_H };
  if (node.kind === "series") {
    const boxes = node.parts.map(measure);
    return {
      w: boxes.reduce((s, b) => s + b.w, 0) + H_GAP * (boxes.length - 1),
      h: Math.max(...boxes.map((b) => b.h)),
    };
  }
  const boxes = node.parts.map(measure);
  return {
    w: Math.max(...boxes.map((b) => b.w)) + 2 * BUS,
    h: boxes.reduce((s, b) => s + b.h, 0) + V_GAP * (boxes.length - 1),
  };
}

function wire(x1: number, y1: number, x2: number, y2: number, key: string) {
  return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={WIRE} strokeWidth="2.5" />;
}

function Resistor({ x, midY, label, ohms }: { x: number; midY: number; label: string; ohms: number }) {
  // Zig-zag occupies the middle ~40px, with short wire stubs either side.
  const stub = (RES_W - 40) / 2;
  const zx = x + stub;
  const d = `M ${zx},${midY} l 5,-9 l 8,18 l 8,-18 l 8,18 l 8,-18 l 5,9`;
  return (
    <g>
      {wire(x, midY, zx, midY, "rl")}
      <path d={d} fill="none" stroke="#f472b6" strokeWidth="2.5" />
      {wire(zx + 42, midY, x + RES_W, midY, "rr")}
      <text x={x + RES_W / 2} y={midY - 13} textAnchor="middle" fill="#fda4af" fontSize="11" fontWeight="bold">
        {label}
      </text>
      <text x={x + RES_W / 2} y={midY + 22} textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
        {ohms} Ω
      </text>
    </g>
  );
}

/** Renders a node inside box (x, y, w, h); terminals at left-mid and right-mid. */
function renderNode(node: NetworkNode, x: number, y: number, box: Box, kp: string): JSX.Element[] {
  const midY = y + box.h / 2;

  if (node.kind === "resistor") {
    return [<Resistor key={kp} x={x} midY={midY} label={node.label} ohms={node.ohms} />];
  }

  if (node.kind === "series") {
    const els: JSX.Element[] = [];
    let cx = x;
    node.parts.forEach((part, i) => {
      const pb = measure(part);
      const py = y + (box.h - pb.h) / 2;
      els.push(...renderNode(part, cx, py, pb, `${kp}-s${i}`));
      cx += pb.w;
      if (i < node.parts.length - 1) {
        els.push(wire(cx, midY, cx + H_GAP, midY, `${kp}-w${i}`));
        cx += H_GAP;
      }
    });
    return els;
  }

  // parallel
  const els: JSX.Element[] = [];
  const innerW = box.w - 2 * BUS;
  const leftBusX = x + BUS;
  const rightBusX = x + box.w - BUS;
  let cy = y;
  const centers: number[] = [];
  node.parts.forEach((part, i) => {
    const pb = measure(part);
    const px = leftBusX + (innerW - pb.w) / 2;
    const bc = cy + pb.h / 2;
    centers.push(bc);
    els.push(...renderNode(part, px, cy, pb, `${kp}-p${i}`));
    els.push(wire(leftBusX, bc, px, bc, `${kp}-pl${i}`));
    els.push(wire(px + pb.w, bc, rightBusX, bc, `${kp}-pr${i}`));
    cy += pb.h + V_GAP;
  });
  const top = centers[0];
  const bot = centers[centers.length - 1];
  els.push(wire(leftBusX, top, leftBusX, bot, `${kp}-busL`));
  els.push(wire(rightBusX, top, rightBusX, bot, `${kp}-busR`));
  els.push(wire(x, midY, leftBusX, midY, `${kp}-inL`));
  els.push(wire(rightBusX, midY, x + box.w, midY, `${kp}-inR`));
  return els;
}

export function NetworkVisual({ spec, quiz = false }: NetworkVisualProps) {
  const root = measure(spec.root);
  const sol = solveNetwork(spec);

  const XL = 26; // left edge (battery + return wire)
  const leftPad = 86; // network starts here, room for battery + lead
  const topPad = 26;
  const railY = topPad + root.h / 2;
  const netX = leftPad;
  const exitX = netX + root.w;
  const XR = exitX + 30;
  const botY = topPad + root.h + 46;

  const W = XR + 16;
  const H = botY + 22;

  const battCy = (railY + botY) / 2;

  const els = renderNode(spec.root, netX, topPad, root, "n");

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto" style={{ minWidth: Math.min(W, 320), width: "100%", maxWidth: W }} aria-label="Resistor network diagram">
        {/* Outer loop */}
        {wire(XL, railY, netX, railY, "lead-in")}
        {wire(exitX, railY, XR, railY, "lead-out")}
        {wire(XR, railY, XR, botY, "right")}
        {wire(XR, botY, XL, botY, "bottom")}
        {wire(XL, railY, XL, battCy - 16, "left-top")}
        {wire(XL, battCy + 16, XL, botY, "left-bot")}

        {/* Battery (vertical) on the left edge */}
        <line x1={XL - 11} y1={battCy - 16} x2={XL + 11} y2={battCy - 16} stroke="#e2e8f0" strokeWidth="2" />
        <line x1={XL - 7} y1={battCy + 16} x2={XL + 7} y2={battCy + 16} stroke="#e2e8f0" strokeWidth="5" />
        <text x={XL - 16} y={battCy + 4} textAnchor="end" fill="#fbbf24" fontSize="12" fontWeight="bold">
          {spec.voltage}V
        </text>

        {/* Network body */}
        {els}

        {/* Readings panel only outside quiz mode */}
        {!quiz && (
          <text x={W / 2} y={H - 5} textAnchor="middle" fill="#64748b" fontSize="10">
            R_eq = {sol.equivalentResistance} Ω · total I = {round2(sol.totalCurrent)} A
          </text>
        )}
      </svg>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

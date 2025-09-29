"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import type { DutyStatus } from "@/lib/api/duty-periods";

type GridPeriod = {
  id?: number | string;
  duty_status: DutyStatus;
  grid_start_minute: number; // 0..1439
  grid_end_minute: number; // 0..1439
};

export type FmcsaGridProps = {
  periods: GridPeriod[];
  className?: string;
  showLegend?: boolean;
  onResize?: (id: number | string, startMinute: number, endMinute: number) => void;
};

const VIEW_WIDTH = 1440; 
const PADDING_LEFT = 16;
const PADDING_RIGHT = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;
const ROW_LABEL_WIDTH = 110;
const ROW_HEIGHT = 40;
const ROW_GAP = 12;
const ROWS = ["Off Duty", "Sleeper Berth", "Driving", "On Duty"] as const;
const STATUS_TO_ROW: Record<DutyStatus, number> = {
  off_duty: 0,
  sleeper_berth: 1,
  driving: 2,
  on_duty: 3,
};

const rowY = (rowIndex: number) =>
  PADDING_TOP + rowIndex * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2;

const hourTicks = Array.from({ length: 25 }).map((_, i) => i * 60);
const quarterTicks = Array.from({ length: 96 }).map((_, i) => i * 15);
const round15 = (m: number) => Math.round(m / 15) * 15;

export default function FmcsaGrid({ periods, className, showLegend = true, onResize }: FmcsaGridProps) {
  const contentHeight = ROWS.length * ROW_HEIGHT + (ROWS.length - 1) * ROW_GAP;
  const height = PADDING_TOP + contentHeight + PADDING_BOTTOM;
  const svgRef = useRef<SVGSVGElement | null>(null);

  const sorted = useMemo(() => {
    return [...periods].sort((a, b) => a.grid_start_minute - b.grid_start_minute);
  }, [periods]);

  const transitions = useMemo(() => {
    const lines: { x: number; y1: number; y2: number; key: string }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (
        typeof prev.grid_end_minute === "number" &&
        typeof cur.grid_start_minute === "number" &&
        prev.grid_end_minute === cur.grid_start_minute &&
        prev.duty_status !== cur.duty_status
      ) {
        const x = prev.grid_end_minute;
        const y1 = rowY(STATUS_TO_ROW[prev.duty_status]);
        const y2 = rowY(STATUS_TO_ROW[cur.duty_status]);
        lines.push({ x, y1, y2, key: `t-${i}-${x}` });
      }
    }
    return lines;
  }, [sorted]);

  const clamp = (m: number) => Math.max(0, Math.min(1439, m));

  const [hover, setHover] = useState<
    | { type: "cursor"; minute: number; row: number; x: number; y: number }
    | { type: "period"; period: GridPeriod; x: number; y: number }
    | null
  >(null);
  const [resizing, setResizing] = useState<
    | { id: number | string; handle: "start" | "end"; anchorMinute: number; otherMinute: number; rowIndex: number }
    | null
  >(null);

  const toSvgPoint = useCallback((evt: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = (evt as MouseEvent).clientX;
    pt.y = (evt as MouseEvent).clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = ctm.inverse();
    const { x, y } = pt.matrixTransform(inv);
    return { x, y };
  }, []);

  const xToMinute = (x: number) => {
    const localX = x - (ROW_LABEL_WIDTH + PADDING_LEFT);
    const m = clamp(Math.round(localX));
    return round15(m);
  };

  const yToRowIndex = (y: number) => {
    let idx = 0;
    let best = Infinity;
    for (let i = 0; i < ROWS.length; i++) {
      const cy = rowY(i);
      const d = Math.abs(cy - y);
      if (d < best) {
        best = d;
        idx = i;
      }
    }
    return idx;
  };

  const onBgMouseMove = (e: React.MouseEvent) => {
    const { x, y } = toSvgPoint(e);
    const minute = xToMinute(x);
    const row = yToRowIndex(y);
    setHover({ type: "cursor", minute, row, x, y });
  };

  const onBgMouseLeave = () => setHover(null);

  const onHandleMouseDown = (
    e: React.MouseEvent,
    period: GridPeriod,
    handle: "start" | "end",
  ) => {
    e.stopPropagation();
    const rowIndex = STATUS_TO_ROW[period.duty_status];
    if (handle === "start") {
      setResizing({ id: period.id ?? `${period.duty_status}-${period.grid_start_minute}` , handle, anchorMinute: period.grid_end_minute, otherMinute: period.grid_end_minute, rowIndex });
    } else {
      setResizing({ id: period.id ?? `${period.duty_status}-${period.grid_end_minute}` , handle, anchorMinute: period.grid_start_minute, otherMinute: period.grid_start_minute, rowIndex });
    }
  };

  const onSvgMouseMove = (e: React.MouseEvent) => {
    if (!resizing) return;
    const { x } = toSvgPoint(e);
    const minute = xToMinute(x);
    setResizing({ ...resizing, otherMinute: minute });
  };

  const onSvgMouseUp = () => {
    if (!resizing) return;
    const start = Math.min(resizing.anchorMinute, resizing.otherMinute);
    const end = Math.max(resizing.anchorMinute, resizing.otherMinute);
    if (onResize && start !== end) onResize(resizing.id, start, end);
    setResizing(null);
  };

  return (
    <div className={className}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${ROW_LABEL_WIDTH + PADDING_LEFT + VIEW_WIDTH + PADDING_RIGHT} ${height}`}
        width="100%"
        height="auto"
        preserveAspectRatio="none"
        onMouseMove={(e) => {
          onBgMouseMove(e);
          onSvgMouseMove(e);
        }}
        onMouseLeave={onBgMouseLeave}
        onMouseUp={onSvgMouseUp}
      >
        {ROWS.map((label, idx) => (
          <text
            key={label}
            x={ROW_LABEL_WIDTH - 6}
            y={rowY(idx) + 4}
            textAnchor="end"
            fontSize={12}
            fill="#555"
          >
            {label}
          </text>
        ))}

        {ROWS.map((_, idx) => (
          <line
            key={`row-${idx}`}
            x1={ROW_LABEL_WIDTH + PADDING_LEFT}
            x2={ROW_LABEL_WIDTH + PADDING_LEFT + VIEW_WIDTH}
            y1={rowY(idx)}
            y2={rowY(idx)}
            stroke="#d1d5db"
            strokeWidth={1}
          />
        ))}

        {quarterTicks.map((m, i) => (
          <line
            key={`q-${i}`}
            x1={ROW_LABEL_WIDTH + PADDING_LEFT + m}
            x2={ROW_LABEL_WIDTH + PADDING_LEFT + m}
            y1={PADDING_TOP - 8}
            y2={PADDING_TOP + contentHeight + 8}
            stroke="#e5e7eb"
            strokeWidth={m % 60 === 0 ? 0 : 1}
          />
        ))}

        {hourTicks.map((m, i) => (
          <g key={`h-${i}`}>
            <line
              x1={ROW_LABEL_WIDTH + PADDING_LEFT + m}
              x2={ROW_LABEL_WIDTH + PADDING_LEFT + m}
              y1={PADDING_TOP - 12}
              y2={PADDING_TOP + contentHeight + 12}
              stroke="#cbd5e1"
              strokeWidth={m % 120 === 0 ? 2 : 1}
            />
            <text
              x={ROW_LABEL_WIDTH + PADDING_LEFT + m}
              y={PADDING_TOP + contentHeight + 20}
              textAnchor="middle"
              fontSize={10}
              fill="#4b5563"
            >
              {`${String(i).padStart(2, "0")}:00`}
            </text>
          </g>
        ))}

        {sorted.map((p, idx) => {
          const y = rowY(STATUS_TO_ROW[p.duty_status]);
          const x1 = ROW_LABEL_WIDTH + PADDING_LEFT + clamp(p.grid_start_minute);
          const x2 = ROW_LABEL_WIDTH + PADDING_LEFT + clamp(p.grid_end_minute);
          return (
            <g
              key={`seg-${p.id ?? idx}`}
              onMouseEnter={(e) => setHover({ type: "period", period: p, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHover(null)}
            >
              <line x1={x1} x2={x2} y1={y} y2={y} stroke="#111827" strokeWidth={3} />
              {/* Drag handles */}
              <rect
                x={x1 - 6}
                y={y - 10}
                width={12}
                height={20}
                fill="transparent"
                onMouseDown={(e) => onHandleMouseDown(e, p, "start")}
                style={{ cursor: "ew-resize" }}
              />
              <rect
                x={x2 - 6}
                y={y - 10}
                width={12}
                height={20}
                fill="transparent"
                onMouseDown={(e) => onHandleMouseDown(e, p, "end")}
                style={{ cursor: "ew-resize" }}
              />
              {/* End caps */}
              <circle cx={x1} cy={y} r={2} fill="#111827" />
              <circle cx={x2} cy={y} r={2} fill="#111827" />
            </g>
          );
        })}

        {transitions.map((t) => (
          <line
            key={t.key}
            x1={ROW_LABEL_WIDTH + PADDING_LEFT + t.x}
            x2={ROW_LABEL_WIDTH + PADDING_LEFT + t.x}
            y1={t.y1}
            y2={t.y2}
            stroke="#111827"
            strokeWidth={3}
          />
        ))}
        {resizing && (
          <line
            x1={ROW_LABEL_WIDTH + PADDING_LEFT + Math.min(resizing.anchorMinute, resizing.otherMinute)}
            x2={ROW_LABEL_WIDTH + PADDING_LEFT + Math.max(resizing.anchorMinute, resizing.otherMinute)}
            y1={rowY(resizing.rowIndex)}
            y2={rowY(resizing.rowIndex)}
            stroke="#2563eb"
            strokeWidth={4}
            opacity={0.6}
          />
        )}
      </svg>

      {showLegend && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 md:grid-cols-4">
          {ROWS.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <span className="inline-block h-[3px] w-6 rounded bg-gray-900" />
              {r}
            </div>
          ))}
        </div>
      )}

      {hover && hover.type === "cursor" && (
        <div
          className="pointer-events-none absolute rounded bg-white px-2 py-1 text-xs shadow ring-1 ring-gray-200"
          style={{
            transform: `translate(${hover.x + 12}px, ${hover.y + 12}px)`,
          }}
        >
          {formatMinute(hover.minute)} on {ROWS[hover.row]}
        </div>
      )}
      {hover && hover.type === "period" && (
        <div
          className="pointer-events-none absolute rounded bg-white px-2 py-1 text-xs shadow ring-1 ring-gray-200"
          style={{ transform: `translate(${hover.x + 12}px, ${hover.y + 12}px)` }}
        >
          <div className="font-medium capitalize">{hover.period.duty_status.replace("_", " ")}</div>
          <div>
            {formatMinute(hover.period.grid_start_minute)} – {formatMinute(hover.period.grid_end_minute)}
          </div>
        </div>
      )}
    </div>
  );
}

function formatMinute(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const h2 = String(h).padStart(2, "0");
  const m2 = String(min).padStart(2, "0");
  return `${h2}:${m2}`;
}

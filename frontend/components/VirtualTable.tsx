"use client";

import { useMemo, useRef, useState } from "react";

interface Column {
  key: string;
  header: string;
  accent?: boolean;
}

interface Props {
  columns: Column[];
  rowCount: number;
  getCell: (rowIndex: number, columnKey: string) => React.ReactNode;
  rowLabel?: (rowIndex: number) => React.ReactNode;
  rowHeight?: number;
  height?: number;
  colWidth?: number;
  emptyMessage?: string;
}

const OVERSCAN = 8;

// windowed table, only mounts rows near the visible scroll range so big CSVs
// don't turn into a 50k-row DOM
export function VirtualTable({
  columns,
  rowCount,
  getCell,
  rowLabel,
  rowHeight = 30,
  height = 420,
  colWidth = 170,
  emptyMessage = "No rows.",
}: Props) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { startIndex, endIndex, paddingTop, paddingBottom } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
    const visibleCount = Math.ceil(height / rowHeight) + OVERSCAN * 2;
    const end = Math.min(rowCount, start + visibleCount);
    return {
      startIndex: start,
      endIndex: end,
      paddingTop: start * rowHeight,
      paddingBottom: Math.max(0, (rowCount - end) * rowHeight),
    };
  }, [scrollTop, rowHeight, height, rowCount]);

  const gridTemplateColumns = `56px repeat(${columns.length}, ${colWidth}px)`;
  const visibleRows = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i);

  return (
    <div className="rounded border border-line bg-panel shadow-bezel">
      <div
        ref={containerRef}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="overflow-auto"
        style={{ maxHeight: height }}
      >
        <div style={{ minWidth: `calc(56px + ${columns.length} * ${colWidth}px)` }}>
          <div
            className="sticky top-0 z-10 grid border-b border-line bg-panel-raised font-data text-xs"
            style={{ gridTemplateColumns }}
          >
            <div className="border-r border-line px-3 py-2 text-ink-faint">#</div>
            {columns.map((c) => (
              <div
                key={c.key}
                className={
                  "truncate px-3 py-2 font-semibold uppercase tracking-wide " +
                  (c.accent ? "text-signal-bad" : "text-amber")
                }
              >
                {c.header}
              </div>
            ))}
          </div>

          {rowCount === 0 ? (
            <div className="px-3 py-6 text-center font-data text-xs text-ink-faint">
              {emptyMessage}
            </div>
          ) : (
            <div style={{ paddingTop, paddingBottom }}>
              {visibleRows.map((rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid border-b border-line font-data text-xs odd:bg-white/[0.015] hover:bg-amber/5"
                  style={{ gridTemplateColumns, height: rowHeight }}
                >
                  <div className="flex items-center border-r border-line px-3 text-ink-faint">
                    {rowLabel ? rowLabel(rowIndex) : rowIndex + 1}
                  </div>
                  {columns.map((c) => (
                    <div key={c.key} className="flex items-center truncate px-3 text-ink-dim">
                      {getCell(rowIndex, c.key) || <span className="text-ink-faint">—</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

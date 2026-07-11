"use client";

import { useState } from "react";
import { CrmRecord, ExtractionResult } from "@/lib/types";
import { VirtualTable } from "./VirtualTable";

const CRM_COLUMNS: (keyof CrmRecord)[] = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

function Stat({ label, value, tone }: { label: string; value: number; tone: "ok" | "bad" | "amber" }) {
  const color =
    tone === "ok" ? "text-signal-ok" : tone === "bad" ? "text-signal-bad" : "text-amber";
  return (
    <div className="rounded border border-line bg-panel px-4 py-3">
      <div className="font-data text-[11px] uppercase tracking-widest text-ink-faint">{label}</div>
      <div className={`font-data text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

export function ResultTable({ result }: { result: ExtractionResult }) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");

  const skippedColumns = [
    { key: "reason", header: "Reason", accent: true },
    { key: "raw", header: "Raw Row" },
  ];

  return (
    <div className="space-y-4">
      {result.engine === "mock" && (
        <div className="rounded border border-amber bg-panel px-4 py-2 font-data text-[11px] uppercase tracking-widest text-amber">
          Demo mode &middot; rule-based mapping, no LLM key configured on this deployment
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Input" value={result.total_input} tone="amber" />
        <Stat label="Imported" value={result.total_imported} tone="ok" />
        <Stat label="Skipped" value={result.total_skipped} tone="bad" />
        <Stat
          label="Success Rate"
          value={
            result.total_input === 0
              ? 0
              : Math.round((result.total_imported / result.total_input) * 100)
          }
          tone="amber"
        />
      </div>

      <div className="flex gap-2 font-data text-xs uppercase tracking-widest">
        <button
          onClick={() => setTab("imported")}
          className={
            "rounded border px-3 py-1.5 " +
            (tab === "imported"
              ? "border-signal-ok text-signal-ok"
              : "border-line text-ink-faint hover:text-ink-dim")
          }
        >
          Imported ({result.total_imported})
        </button>
        <button
          onClick={() => setTab("skipped")}
          className={
            "rounded border px-3 py-1.5 " +
            (tab === "skipped"
              ? "border-signal-bad text-signal-bad"
              : "border-line text-ink-faint hover:text-ink-dim")
          }
        >
          Skipped ({result.total_skipped})
        </button>
      </div>

      {tab === "imported" ? (
        <VirtualTable
          columns={CRM_COLUMNS.map((c) => ({ key: c, header: c }))}
          rowCount={result.imported.length}
          rowLabel={(i) => result.imported[i].row_index + 1}
          getCell={(i, key) => result.imported[i][key as keyof CrmRecord]}
          emptyMessage="Nothing imported yet."
        />
      ) : (
        <VirtualTable
          columns={skippedColumns}
          colWidth={320}
          rowCount={result.skipped.length}
          rowLabel={(i) => result.skipped[i].row_index + 1}
          getCell={(i, key) => {
            const row = result.skipped[i];
            if (key === "reason") return row.reason;
            return Object.entries(row.raw)
              .filter(([, v]) => v)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ");
          }}
          emptyMessage="Nothing skipped, every row had an email or mobile number."
        />
      )}
    </div>
  );
}

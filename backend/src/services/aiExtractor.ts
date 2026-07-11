import { config } from "../config";
import { RawCsvRow, CrmRecordDraft, ExtractionResult } from "../types";
import { chunk, runWithConcurrency } from "../utils/batching";
import { buildBatchPrompt, SYSTEM_PROMPT } from "../utils/prompt";
import { callAiProvider, extractJson } from "./aiProviders";
import { mockExtractBatch } from "./aiProviders/mock";
import { validateDraft } from "./validator";

interface BatchResponse {
  records: CrmRecordDraft[];
}

async function extractBatch(rows: RawCsvRow[]): Promise<CrmRecordDraft[]> {
  if (config.aiProvider === "mock") return mockExtractBatch(rows);

  const raw = await callAiProvider(SYSTEM_PROMPT, buildBatchPrompt(rows));
  const parsed = extractJson(raw) as BatchResponse;

  if (!parsed || !Array.isArray(parsed.records)) {
    throw new Error("AI response did not contain a `records` array");
  }

  const byIndex = new Map(parsed.records.map((r) => [r.row_index, r]));
  // fill in a skip record for any row the model just... didn't return
  return rows.map((row) => {
    const draft = byIndex.get(row.row_index);
    if (draft) return draft;
    return {
      row_index: row.row_index,
      created_at: "",
      name: "",
      email: "",
      country_code: "",
      mobile_without_country_code: "",
      company: "",
      city: "",
      state: "",
      country: "",
      lead_owner: "",
      crm_status: "",
      crm_note: "",
      data_source: "",
      possession_time: "",
      description: "",
      skip: true,
      skip_reason: "AI did not return a result for this row",
    };
  });
}

type BatchParts = { imported: ExtractionResult["imported"]; skipped: ExtractionResult["skipped"] };

function settleBatch(
  batchRows: RawCsvRow[],
  outcome: { result?: CrmRecordDraft[]; error?: Error }
): BatchParts {
  const imported: ExtractionResult["imported"] = [];
  const skipped: ExtractionResult["skipped"] = [];

  if (outcome.error || !outcome.result) {
    for (const row of batchRows) {
      skipped.push({
        row_index: row.row_index,
        raw: row.data,
        reason: `AI extraction failed: ${outcome.error?.message || "unknown error"}`,
      });
    }
    return { imported, skipped };
  }

  for (const draft of outcome.result) {
    const row = batchRows.find((r) => r.row_index === draft.row_index);
    const v = validateDraft(draft);
    if (v.ok && v.record) {
      imported.push(v.record);
    } else {
      skipped.push({ row_index: draft.row_index, raw: row?.data || {}, reason: v.reason || "Skipped" });
    }
  }
  return { imported, skipped };
}

function finalize(rows: RawCsvRow[], parts: BatchParts[]): ExtractionResult {
  const imported = parts.flatMap((p) => p.imported).sort((a, b) => a.row_index - b.row_index);
  const skipped = parts.flatMap((p) => p.skipped).sort((a, b) => a.row_index - b.row_index);
  return {
    imported,
    skipped,
    total_input: rows.length,
    total_imported: imported.length,
    total_skipped: skipped.length,
    engine: config.aiProvider,
  };
}

export interface BatchProgress {
  completedBatches: number;
  totalBatches: number;
  batchImported: ExtractionResult["imported"];
  batchSkipped: ExtractionResult["skipped"];
}

// chunks rows into batches, runs them through the AI with retries/concurrency,
// calls onBatch as each one finishes so the route can stream progress
export async function extractCrmRecordsStreaming(
  rows: RawCsvRow[],
  onBatch: (progress: BatchProgress) => void
): Promise<ExtractionResult> {
  const batches = chunk(rows, config.batchSize);
  const parts: BatchParts[] = new Array(batches.length);
  let completed = 0;

  await runWithConcurrency(
    batches,
    config.batchConcurrency,
    config.batchMaxRetries,
    extractBatch,
    (outcome) => {
      const part = settleBatch(batches[outcome.index], outcome);
      parts[outcome.index] = part;
      completed += 1;
      onBatch({
        completedBatches: completed,
        totalBatches: batches.length,
        batchImported: part.imported,
        batchSkipped: part.skipped,
      });
    }
  );

  return finalize(rows, parts);
}

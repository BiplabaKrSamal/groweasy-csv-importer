import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/services/aiProviders", () => ({
  callAiProvider: vi.fn(),
  extractJson: (raw: string) => JSON.parse(raw),
}));

import { callAiProvider } from "../src/services/aiProviders";
import { extractCrmRecordsStreaming } from "../src/services/aiExtractor";
import { RawCsvRow } from "../src/types";

function row(index: number, data: Record<string, string>): RawCsvRow {
  return { row_index: index, data };
}

function draftFor(rowIndex: number, email: string) {
  return {
    row_index: rowIndex,
    created_at: "2026-06-01 10:00:00",
    name: "Test Lead",
    email,
    country_code: "+91",
    mobile_without_country_code: "9876543210",
    company: "",
    city: "",
    state: "",
    country: "",
    lead_owner: "",
    crm_status: "GOOD_LEAD_FOLLOW_UP",
    crm_note: "",
    data_source: "leads_on_demand",
    possession_time: "",
    description: "",
    skip: false,
  };
}

beforeEach(() => {
  vi.mocked(callAiProvider).mockReset();
});

describe("extractCrmRecordsStreaming", () => {
  it("reports one progress event per batch and a correct final result", async () => {
    const rows = [row(0, { email: "a@x.com" }), row(1, { email: "b@x.com" })];

    vi.mocked(callAiProvider).mockImplementation(async (_system, user) => {
      const parsed = JSON.parse(user.slice(user.indexOf("[")));
      const records = parsed.map((r: { row_index: number }) => draftFor(r.row_index, "ok@x.com"));
      return JSON.stringify({ records });
    });

    const events: number[] = [];
    const result = await extractCrmRecordsStreaming(rows, (p) => {
      events.push(p.completedBatches);
    });

    expect(events.length).toBeGreaterThan(0);
    expect(result.total_input).toBe(2);
    expect(result.total_imported).toBe(2);
    expect(result.total_skipped).toBe(0);
  });

  it("marks every row in a batch as skipped when the AI call fails after retries", async () => {
    const rows = [row(0, { email: "a@x.com" }), row(1, { email: "b@x.com" })];
    vi.mocked(callAiProvider).mockRejectedValue(new Error("provider down"));

    const result = await extractCrmRecordsStreaming(rows, () => {});

    expect(result.total_imported).toBe(0);
    expect(result.total_skipped).toBe(2);
    expect(result.skipped[0].reason).toMatch(/provider down/);
  }, 15000);
});

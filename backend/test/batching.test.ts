import { describe, it, expect, vi } from "vitest";
import { chunk, runWithConcurrency } from "../src/utils/batching";

describe("chunk", () => {
  it("splits into groups of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns an empty array for empty input", () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

describe("runWithConcurrency", () => {
  it("returns a result for every item, preserving input order", async () => {
    const outcomes = await runWithConcurrency([1, 2, 3], 2, 0, async (n) => n * 10);
    expect(outcomes.map((o) => o.result)).toEqual([10, 20, 30]);
  });

  it("retries a failing worker up to maxRetries before giving up", async () => {
    let calls = 0;
    const worker = vi.fn(async () => {
      calls++;
      throw new Error("boom");
    });
    const outcomes = await runWithConcurrency([1], 1, 2, worker);
    expect(calls).toBe(3); // 1 initial attempt + 2 retries
    expect(outcomes[0].error?.message).toBe("boom");
  });

  it("does not fail the whole batch when only one item errors", async () => {
    const worker = async (n: number) => {
      if (n === 2) throw new Error("bad item");
      return n;
    };
    const outcomes = await runWithConcurrency([1, 2, 3], 3, 0, worker);
    expect(outcomes[0].result).toBe(1);
    expect(outcomes[1].error?.message).toBe("bad item");
    expect(outcomes[2].result).toBe(3);
  });

  it("fires onItemDone as each item settles, for streaming progress", async () => {
    const seen: number[] = [];
    await runWithConcurrency([1, 2, 3], 3, 0, async (n) => n, (outcome) => {
      if (outcome.result) seen.push(outcome.result);
    });
    expect(seen.sort()).toEqual([1, 2, 3]);
  });
});

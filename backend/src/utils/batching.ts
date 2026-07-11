export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export type BatchOutcome<R> = { index: number; result?: R; error?: Error };

// simple worker pool: N in flight at a time, retries with backoff, reports each
// item back via onItemDone as soon as it's done (out of order) so callers can stream progress
export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  maxRetries: number,
  worker: (item: T, index: number) => Promise<R>,
  onItemDone?: (outcome: BatchOutcome<R>) => void
): Promise<Array<BatchOutcome<R>>> {
  const results: Array<BatchOutcome<R>> = new Array(items.length);
  let cursor = 0;

  async function runOne(item: T, index: number) {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await worker(item, index);
        const outcome = { index, result };
        results[index] = outcome;
        onItemDone?.(outcome);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
        }
      }
    }
    const outcome = { index, error: lastError };
    results[index] = outcome;
    onItemDone?.(outcome);
  }

  async function lane() {
    while (cursor < items.length) {
      const index = cursor++;
      await runOne(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
  return results;
}

import { parse } from "csv-parse/sync";
import { RawCsvRow } from "../types";

export class CsvParseError extends Error {}

// column mapping happens later, in the AI step. don't assume fixed headers here.
export function parseCsv(csvText: string): RawCsvRow[] {
  let records: Record<string, string>[];
  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw new CsvParseError(
      `Could not parse CSV: ${err instanceof Error ? err.message : "unknown error"}`
    );
  }

  if (records.length === 0) {
    throw new CsvParseError("CSV file has no data rows.");
  }

  return records.map((data, i) => ({ row_index: i, data }));
}

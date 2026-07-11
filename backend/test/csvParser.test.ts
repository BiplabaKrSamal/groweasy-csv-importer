import { describe, it, expect } from "vitest";
import { parseCsv, CsvParseError } from "../src/services/csvParser";

describe("parseCsv", () => {
  it("parses rows keyed by whatever headers the file actually has", () => {
    const csv = "Full Name,E-mail\nJohn Doe,john@x.com\n";
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].data).toEqual({ "Full Name": "John Doe", "E-mail": "john@x.com" });
    expect(rows[0].row_index).toBe(0);
  });

  it("assigns sequential row_index in file order", () => {
    const csv = "name\na\nb\nc\n";
    const rows = parseCsv(csv);
    expect(rows.map((r) => r.row_index)).toEqual([0, 1, 2]);
  });

  it("throws CsvParseError on a header-only file with no data rows", () => {
    expect(() => parseCsv("name,email\n")).toThrow(CsvParseError);
  });

  it("throws CsvParseError on malformed CSV", () => {
    expect(() => parseCsv("")).toThrow(CsvParseError);
  });

  it("tolerates a byte-order mark and ragged column counts", () => {
    const csv = "\uFEFFname,email,extra\nJohn,john@x.com\n";
    const rows = parseCsv(csv);
    expect(rows[0].data.name).toBe("John");
  });
});

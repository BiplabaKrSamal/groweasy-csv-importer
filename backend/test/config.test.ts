import { describe, it, expect } from "vitest";
import { parseCorsOrigin } from "../src/config";

describe("parseCorsOrigin", () => {
  it("returns a bare wildcard string for '*', not an array", () => {
    // this is the actual bug: cors() treats the bare string "*" as "allow any
    // origin", but treats an array (even ["*"]) as a literal membership list
    // that no real browser Origin header will ever match
    const result = parseCorsOrigin("*");
    expect(result).toBe("*");
    expect(Array.isArray(result)).toBe(false);
  });

  it("defaults to a bare wildcard string when unset", () => {
    const result = parseCorsOrigin(undefined);
    expect(result).toBe("*");
    expect(Array.isArray(result)).toBe(false);
  });

  it("still splits a real comma-separated origin list into an array", () => {
    const result = parseCorsOrigin("https://a.com,https://b.com");
    expect(result).toEqual(["https://a.com", "https://b.com"]);
  });

  it("trims whitespace around each origin in a list", () => {
    const result = parseCorsOrigin("https://a.com, https://b.com , https://c.com");
    expect(result).toEqual(["https://a.com", "https://b.com", "https://c.com"]);
  });

  it("treats a single non-wildcard origin as a one-element array", () => {
    const result = parseCorsOrigin("https://groweasy-csv-importer-frontend.onrender.com");
    expect(result).toEqual(["https://groweasy-csv-importer-frontend.onrender.com"]);
  });

  it("trims whitespace around a bare wildcard", () => {
    const result = parseCorsOrigin("  *  ");
    expect(result).toBe("*");
  });
});

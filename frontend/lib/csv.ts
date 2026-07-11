import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

// client-side parse for the preview step, no AI call yet
export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
          return;
        }
        resolve({
          headers: results.meta.fields || [],
          rows: results.data,
        });
      },
      error: (err) => reject(err),
    });
  });
}

"use client";

import { useCallback, useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { PreviewTable } from "@/components/PreviewTable";
import { ResultTable } from "@/components/ResultTable";
import { StepIndicator } from "@/components/StepIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { parseCsvFile, ParsedCsv } from "@/lib/csv";
import { extractCrmRecords } from "@/lib/api";
import { ExtractionResult, Step } from "@/lib/types";

const EMPTY_RESULT: ExtractionResult = {
  imported: [],
  skipped: [],
  total_input: 0,
  total_imported: 0,
  total_skipped: 0,
  engine: "",
};

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [batches, setBatches] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<ExtractionResult>(EMPTY_RESULT);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback(async (f: File) => {
    setError(null);
    try {
      const p = await parseCsvFile(f);
      if (p.rows.length === 0) {
        setError("This CSV has no data rows.");
        return;
      }
      setFile(f);
      setParsed(p);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that CSV file.");
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file || !parsed) return;
    setStep("processing");
    setUploadProgress(0);
    setBatches(null);
    setError(null);
    setResult({ ...EMPTY_RESULT, total_input: parsed.rows.length });

    try {
      const finalResult = await extractCrmRecords(file, {
        onUploadProgress: setUploadProgress,
        onBatchProgress: (p) => {
          setStep("result");
          setBatches({ done: p.completedBatches, total: p.totalBatches });
          setResult((prev) => ({
            imported: [...prev.imported, ...p.batchImported],
            skipped: [...prev.skipped, ...p.batchSkipped],
            total_input: prev.total_input,
            total_imported: prev.total_imported + p.batchImported.length,
            total_skipped: prev.total_skipped + p.batchSkipped.length,
            engine: prev.engine,
          }));
        },
      });
      setResult(finalResult);
      setBatches(null);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI extraction failed.");
      setStep("preview");
    }
  }, [file, parsed]);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setParsed(null);
    setResult(EMPTY_RESULT);
    setUploadProgress(0);
    setBatches(null);
    setError(null);
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 font-data text-[11px] uppercase tracking-[0.2em] text-amber">
            GrowEasy · Lead Ingest
          </div>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">CSV Importer</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-dim">
            Upload any lead export (Facebook, Google Ads, another CRM, a plain spreadsheet) and
            the AI mapper reads the columns and slots them into GrowEasy&apos;s CRM schema.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="mb-8">
        <StepIndicator current={step} />
      </div>

      {step === "upload" && <FileUpload onFileSelected={handleFileSelected} error={error} />}

      {step === "preview" && parsed && file && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 font-data text-xs text-ink-dim">
            <span>
              <span className="text-amber">{file.name}</span> · {parsed.rows.length} rows ·{" "}
              {parsed.headers.length} columns
            </span>
            <button
              onClick={reset}
              className="text-ink-faint underline decoration-dotted hover:text-ink-dim"
            >
              choose a different file
            </button>
          </div>

          <PreviewTable headers={parsed.headers} rows={parsed.rows} />

          {error && <p className="font-data text-xs text-signal-bad">{error}</p>}

          <div className="flex justify-end">
            <button
              onClick={handleConfirm}
              className="rounded border border-amber bg-amber/10 px-5 py-2.5 font-data text-sm font-semibold uppercase tracking-wider text-amber shadow-glow transition-colors hover:bg-amber/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber"
            >
              Confirm &amp; Extract
            </button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center justify-center rounded border border-line bg-panel px-8 py-20 text-center">
          <div className="mb-6 h-2 w-full max-w-sm overflow-hidden rounded-full border border-line bg-void">
            <div
              className="h-full bg-amber shadow-glow transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="font-data text-sm uppercase tracking-widest text-amber">
            Uploading, {uploadProgress}%
          </p>
          <p className="mt-2 text-xs text-ink-faint">
            Rows will be batched and mapped by the AI model right after upload.
          </p>
        </div>
      )}

      {step === "result" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-data text-xs text-ink-dim">{file?.name}</span>
            <button
              onClick={reset}
              className="rounded border border-line px-3 py-1.5 font-data text-xs uppercase tracking-widest text-ink-dim hover:border-ink-dim hover:text-ink"
            >
              Import another file
            </button>
          </div>

          {batches && (
            <div className="rounded border border-line bg-panel px-4 py-3">
              <div className="mb-2 flex items-center justify-between font-data text-[11px] uppercase tracking-widest text-ink-faint">
                <span>Mapping batches</span>
                <span className="text-amber">
                  {batches.done} / {batches.total}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-void">
                <div
                  className="h-full bg-amber shadow-glow transition-all duration-300"
                  style={{ width: `${(batches.done / batches.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <ResultTable result={result} />
        </div>
      )}
    </main>
  );
}

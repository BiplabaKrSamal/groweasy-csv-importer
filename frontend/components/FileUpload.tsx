"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onFileSelected: (file: File) => void;
  error?: string | null;
}

const MAX_SIZE = 5 * 1024 * 1024;

export function FileUpload({ onFileSelected, error }: Props) {
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setLocalError("Only .csv files are supported.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setLocalError("File exceeds the 5MB limit.");
        return;
      }
      setLocalError(null);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          validateAndEmit(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={
          "flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed px-8 py-16 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber " +
          (dragging
            ? "border-amber bg-amber/5"
            : "border-line bg-panel hover:border-ink-dim")
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => validateAndEmit(e.target.files?.[0])}
        />
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-line text-amber">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12m0-12 4 4m-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-medium text-ink">Drop your CSV file here</p>
        <p className="mt-1 text-sm text-ink-dim">or click to browse files</p>
        <p className="mt-4 font-data text-[11px] uppercase tracking-wider text-ink-faint">
          .csv · max 5MB · any column layout
        </p>
      </div>
      {(localError || error) && (
        <p className="mt-3 font-data text-xs text-signal-bad">{localError || error}</p>
      )}
    </div>
  );
}

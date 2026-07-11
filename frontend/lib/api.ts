import { CrmRecord, ExtractionResult, SkippedRecord } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface BatchProgress {
  completedBatches: number;
  totalBatches: number;
  batchImported: CrmRecord[];
  batchSkipped: SkippedRecord[];
}

interface StreamHandlers {
  onUploadProgress?: (pct: number) => void;
  onBatchProgress?: (progress: BatchProgress) => void;
}

// uploads the csv, reads the backend's SSE stream: upload %, then per-batch progress, then the result
export function extractCrmRecords(file: File, handlers: StreamHandlers = {}): Promise<ExtractionResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/extract`);

    let readOffset = 0;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) handlers.onUploadProgress?.(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(readOffset);
      readOffset = xhr.responseText.length;
      for (const message of chunk.split("\n\n")) {
        if (!message.trim()) continue;
        const eventLine = message.split("\n").find((l) => l.startsWith("event:"));
        const dataLine = message.split("\n").find((l) => l.startsWith("data:"));
        if (!eventLine || !dataLine) continue;

        const event = eventLine.replace("event:", "").trim();
        const data = JSON.parse(dataLine.replace("data:", "").trim());

        if (event === "progress") handlers.onBatchProgress?.(data as BatchProgress);
        if (event === "done") resolve(data as ExtractionResult);
        if (event === "error") reject(new Error(data.error || "AI extraction failed."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error while contacting the extraction API."));
    xhr.onload = () => {
      if (xhr.status >= 400) {
        try {
          reject(new Error(JSON.parse(xhr.responseText).error || `Request failed (${xhr.status})`));
        } catch {
          reject(new Error(`Request failed (${xhr.status})`));
        }
      }
    };

    xhr.send(form);
  });
}

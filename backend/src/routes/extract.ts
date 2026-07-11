import { Router, Response } from "express";
import multer from "multer";
import { parseCsv } from "../services/csvParser";
import { extractCrmRecordsStreaming } from "../services/aiExtractor";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches the frontend's stated limit
});

export const extractRouter = Router();

function sendEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// sends "progress" events per batch, then "done" with the full result
extractRouter.post("/extract", upload.single("file"), async (req, res, next) => {
  if (!req.file) {
    res.status(400).json({ error: "No CSV file was uploaded (expected field `file`)." });
    return;
  }

  let rows;
  try {
    const csvText = req.file.buffer.toString("utf-8");
    rows = parseCsv(csvText);
  } catch (err) {
    next(err);
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  try {
    const result = await extractCrmRecordsStreaming(rows, (progress) => {
      sendEvent(res, "progress", progress);
    });
    sendEvent(res, "done", result);
  } catch (err) {
    sendEvent(res, "error", {
      error: err instanceof Error ? err.message : "AI extraction failed.",
    });
  } finally {
    res.end();
  }
});

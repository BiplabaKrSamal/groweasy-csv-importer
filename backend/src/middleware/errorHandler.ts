import { NextFunction, Request, Response } from "express";
import { CsvParseError } from "../services/csvParser";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof CsvParseError) {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: "Something went wrong while processing the file.",
  });
}

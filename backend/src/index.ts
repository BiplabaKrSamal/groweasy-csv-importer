import express from "express";
import cors from "cors";
import { config } from "./config";
import { extractRouter } from "./routes/extract";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", extractRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`GrowEasy CSV importer API listening on :${config.port} (provider: ${config.aiProvider})`);
});

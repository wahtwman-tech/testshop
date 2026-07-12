import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the frontend build (sheep-store)
const frontendDistPath = path.resolve(__dirname, "..", "sheep-store", "dist", "public");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend build
app.use(express.static(frontendDistPath));

// API routes
app.use("/api", router);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Serve the frontend app for all other routes (SPA support)
app.get("(.*)", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) {
      res.status(404).send("Frontend not built. Run 'pnpm run build' first.");
    }
  });
});

export default app;

// Production server entry point for Vercel
// This file intentionally does NOT import server/vite.ts
// to avoid bundling vite/rollup into the production function

import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { initializeDatabase } from "./initDatabase";
import { seed } from "./seed";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

// Middleware to ensure the server is initialized before handling requests
app.use(async (req, res, next) => {
  try {
    await serverPromise;
    next();
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

async function startServer() {
  const { pool } = await import("./db");
  const { setupAuthentication } = await import("./auth");
  const { registerRoutes } = await import("./routes");

  let PostgresStore: any;
  const ConnectPg = (await import("connect-pg-simple")).default;
  PostgresStore = ConnectPg(session);

  // Initialize database tables and seed on startup
  try {
    console.log("Initializing database...");
    await initializeDatabase();
    await seed();
    console.log("Database initialization complete.");
  } catch (error) {
    console.error("Failed to initialize or seed database:", error);
  }

  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "peters-catering-secret",
    resave: false,
    saveUninitialized: false,
    store: pool ? new PostgresStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    }) : new MemoryStore({
      checkPeriod: 86400000
    }),
    cookie: {
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  setupAuthentication(app);

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Serve static files from dist/
  const distPath = path.resolve(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    console.log("dist/ not found - static serving disabled");
  }

  return server;
}

const serverPromise = startServer();

// Default export required by Vercel serverless functions
export default app;

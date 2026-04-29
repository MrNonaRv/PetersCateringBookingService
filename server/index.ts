import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./initDatabase";
import { seed } from "./seed";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// We'll import these dynamically inside the startup to avoid top-level await issues in some environments
let PostgresStore: any;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Export app for Vercel
export { app };

// Middleware to ensure the server is initialized before handling requests (especially on Vercel)
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

// Setup function for both local and Vercel
async function startServer() {
  const { pool } = await import("./db");
  const { setupAuthentication } = await import("./auth");
  const { registerRoutes } = await import("./routes");
  
  if (!PostgresStore) {
    const ConnectPg = (await import("connect-pg-simple")).default;
    PostgresStore = ConnectPg(session);
  }

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
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  setupAuthentication(app);

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
}

// Start immediately for local, or handle for Vercel
const serverPromise = startServer();

if (!process.env.VERCEL) {
  serverPromise.then((server) => {
    const port = Number(process.env.PORT) || 3000;
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });
  });
}



import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth";
import { registerBookingRoutes } from "./bookings";
import { registerServiceRoutes } from "./services";
import { registerAdminRoutes } from "./admin";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register modular routes
  registerAuthRoutes(app);
  registerBookingRoutes(app);
  registerServiceRoutes(app);
  registerAdminRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}

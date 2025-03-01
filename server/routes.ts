import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  const SessionStore = MemoryStore(session);

  app.use(session({
    store: new SessionStore({
      checkPeriod: 86400000
    }),
    secret: "zerodigit-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password || !user.isAdmin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.userId = user.id;
    res.json({ success: true });
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy();
    res.json({ success: true });
  });

  // Waitlist routes
  app.get("/api/waitlist", requireAuth, async (_req, res) => {
    const entries = await storage.getWaitlistEntries();
    res.json(entries);
  });

  app.post("/api/waitlist", async (req, res) => {
    try {
      const entry = insertWaitlistSchema.parse(req.body);
      const created = await storage.createWaitlistEntry(entry);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete("/api/waitlist/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteWaitlistEntry(id);
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}

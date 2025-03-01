import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistSchema, insertFileFolderSchema, insertFileSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

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

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: "./uploads",
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    })
  });

  // Ensure uploads directory exists
  await fs.mkdir("./uploads", { recursive: true });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Existing routes remain unchanged
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

  // New routes for file management
  // Folder routes
  app.get("/api/folders", requireAuth, async (req, res) => {
    const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
    const folders = await storage.getFolders(parentId);
    res.json(folders);
  });

  app.post("/api/folders", requireAuth, async (req, res) => {
    try {
      const folder = insertFileFolderSchema.parse(req.body);
      const created = await storage.createFolder(folder);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.patch("/api/folders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const folder = insertFileFolderSchema.partial().parse(req.body);
      const updated = await storage.updateFolder(id, folder);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete("/api/folders/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteFolder(id);
    res.json({ success: true });
  });

  // File routes
  app.get("/api/files", requireAuth, async (req, res) => {
    const folderId = req.query.folderId ? parseInt(req.query.folderId as string) : undefined;
    const files = await storage.getFiles(folderId);
    res.json(files);
  });

  app.post("/api/files", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileData = {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        folderId: req.body.folderId ? parseInt(req.body.folderId) : null,
      };

      try {
        const parsedFile = insertFileSchema.parse(fileData);
        const created = await storage.createFile(parsedFile);
        res.json(created);
      } catch (error) {
        // Clean up the uploaded file if validation fails
        await fs.unlink(req.file.path);
        throw error;
      }
    } catch (error) {
      console.error("File upload error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to upload file" 
      });
    }
  });

  app.get("/api/files/:id/download", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.download(file.path, file.name);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  app.delete("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      if (file) {
        await fs.unlink(file.path);
        await storage.deleteFile(id);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
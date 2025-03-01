import { users, type User, type InsertUser, type Waitlist, type InsertWaitlist, type File, type InsertFile, type FileFolder, type InsertFileFolder } from "@shared/schema";

export interface IStorage {
  // Existing methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getWaitlistEntries(): Promise<Waitlist[]>;
  createWaitlistEntry(entry: InsertWaitlist): Promise<Waitlist>;
  deleteWaitlistEntry(id: number): Promise<void>;

  // New methods for file management
  createFolder(folder: InsertFileFolder): Promise<FileFolder>;
  getFolder(id: number): Promise<FileFolder | undefined>;
  getFolders(parentId?: number): Promise<FileFolder[]>;
  updateFolder(id: number, folder: Partial<InsertFileFolder>): Promise<FileFolder>;
  deleteFolder(id: number): Promise<void>;

  createFile(file: InsertFile): Promise<File>;
  getFile(id: number): Promise<File | undefined>;
  getFiles(folderId?: number): Promise<File[]>;
  updateFile(id: number, file: Partial<InsertFile>): Promise<File>;
  deleteFile(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private waitlist: Map<number, Waitlist>;
  private folders: Map<number, FileFolder>;
  private files: Map<number, File>;
  private currentUserId: number;
  private currentWaitlistId: number;
  private currentFolderId: number;
  private currentFileId: number;

  constructor() {
    this.users = new Map();
    this.waitlist = new Map();
    this.folders = new Map();
    this.files = new Map();
    this.currentUserId = 1;
    this.currentWaitlistId = 1;
    this.currentFolderId = 1;
    this.currentFileId = 1;

    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
    }).then(user => {
      this.users.set(user.id, { ...user, isAdmin: true });
    });
  }

  // Existing methods remain unchanged
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async getWaitlistEntries(): Promise<Waitlist[]> {
    return Array.from(this.waitlist.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createWaitlistEntry(entry: InsertWaitlist): Promise<Waitlist> {
    const id = this.currentWaitlistId++;
    const waitlistEntry: Waitlist = {
      ...entry,
      id,
      createdAt: new Date(),
    };
    this.waitlist.set(id, waitlistEntry);
    return waitlistEntry;
  }

  async deleteWaitlistEntry(id: number): Promise<void> {
    this.waitlist.delete(id);
  }

  // New methods for file management
  async createFolder(folder: InsertFileFolder): Promise<FileFolder> {
    const id = this.currentFolderId++;
    const newFolder: FileFolder = {
      ...folder,
      id,
      createdAt: new Date(),
    };
    this.folders.set(id, newFolder);
    return newFolder;
  }

  async getFolder(id: number): Promise<FileFolder | undefined> {
    return this.folders.get(id);
  }

  async getFolders(parentId?: number): Promise<FileFolder[]> {
    return Array.from(this.folders.values())
      .filter(folder => folder.parentId === parentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateFolder(id: number, folder: Partial<InsertFileFolder>): Promise<FileFolder> {
    const existing = this.folders.get(id);
    if (!existing) throw new Error("Folder not found");

    const updated: FileFolder = {
      ...existing,
      ...folder,
    };
    this.folders.set(id, updated);
    return updated;
  }

  async deleteFolder(id: number): Promise<void> {
    this.folders.delete(id);
    // Also delete all files in this folder
    for (const [fileId, file] of this.files.entries()) {
      if (file.folderId === id) {
        this.files.delete(fileId);
      }
    }
  }

  async createFile(file: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const newFile: File = {
      ...file,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.files.set(id, newFile);
    return newFile;
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFiles(folderId?: number): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.folderId === folderId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateFile(id: number, file: Partial<InsertFile>): Promise<File> {
    const existing = this.files.get(id);
    if (!existing) throw new Error("File not found");

    const updated: File = {
      ...existing,
      ...file,
      updatedAt: new Date(),
    };
    this.files.set(id, updated);
    return updated;
  }

  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
  }
}

export const storage = new MemStorage();
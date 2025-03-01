import { users, type User, type InsertUser, type Waitlist, type InsertWaitlist } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getWaitlistEntries(): Promise<Waitlist[]>;
  createWaitlistEntry(entry: InsertWaitlist): Promise<Waitlist>;
  deleteWaitlistEntry(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private waitlist: Map<number, Waitlist>;
  private currentUserId: number;
  private currentWaitlistId: number;

  constructor() {
    this.users = new Map();
    this.waitlist = new Map();
    this.currentUserId = 1;
    this.currentWaitlistId = 1;
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
    }).then(user => {
      this.users.set(user.id, { ...user, isAdmin: true });
    });
  }

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
}

export const storage = new MemStorage();

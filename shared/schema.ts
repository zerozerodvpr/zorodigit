import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  company: text("company"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fileFolder = pgTable("file_folder", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id").references(() => fileFolder.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const file = pgTable("file", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  folderId: integer("folder_id").references(() => fileFolder.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlist).pick({
  email: true,
  name: true,
  company: true,
}).extend({
  email: z.string().email(),
  name: z.string().min(2),
  company: z.string().optional(),
});

export const insertFileFolderSchema = createInsertSchema(fileFolder).pick({
  name: true,
  description: true,
  parentId: true,
}).extend({
  name: z.string().min(1, "Folder name is required"),
  description: z.string().optional(),
  parentId: z.number().optional(),
});

export const insertFileSchema = createInsertSchema(file).pick({
  name: true,
  type: true,
  size: true,
  path: true,
  folderId: true,
}).extend({
  name: z.string().min(1, "File name is required"),
  type: z.string().min(1, "File type is required"),
  size: z.number().min(0, "File size must be positive"),
  path: z.string().min(1, "File path is required"),
  folderId: z.number().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;
export type InsertFileFolder = z.infer<typeof insertFileFolderSchema>;
export type FileFolder = typeof fileFolder.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof file.$inferSelect;
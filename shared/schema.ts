import { mysqlTable, text, int, boolean, timestamp, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email"),
  linkedinId: text("linkedin_id").unique(),
  linkedinToken: text("linkedin_token"),
  profilePicture: text("profile_picture"),
  fullName: text("full_name"),
});

export const documents = mysqlTable("documents", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id),
  originalName: text("original_name").notNull(),
  fileName: text("file_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isModified: boolean("is_modified").default(false),
  customizations: json("customizations"),
});

export const templates = mysqlTable("templates", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  imagePath: text("image_path").notNull(),
  category: text("category").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  linkedinId: true,
  linkedinToken: true,
  profilePicture: true,
  fullName: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  userId: true,
  originalName: true,
  fileName: true,
  customizations: true,
});

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  imagePath: true,
  category: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

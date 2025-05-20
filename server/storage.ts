import { users, documents, templates, type User, type InsertUser, type Document, type InsertDocument, type Template, type InsertTemplate } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByLinkedinId(linkedinId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLinkedinToken(userId: number, token: string): Promise<User>;
  
  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  getRecentDocuments(userId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocumentCustomizations(id: number, customizations: any): Promise<Document>;
  
  // Template operations
  getTemplate(id: number): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByLinkedinId(linkedinId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.linkedinId, linkedinId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserLinkedinToken(userId: number, token: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ linkedinToken: token })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getRecentDocuments(userId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
      .limit(5);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocumentCustomizations(id: number, customizations: any): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set({ 
        customizations: JSON.stringify(customizations),
        isModified: true 
      })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  // Template operations
  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }
}

export const storage = new DatabaseStorage();

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
    const [result] = await db
      .insert(users)
      .values(insertUser);
    
    // Get the newly created user
    const [user] = await db.select().from(users).where(eq(users.username, insertUser.username!));
    return user;
  }

  async updateUserLinkedinToken(userId: number, token: string): Promise<User> {
    await db
      .update(users)
      .set({ linkedinToken: token })
      .where(eq(users.id, userId));
    
    const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
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
    const [result] = await db
      .insert(documents)
      .values(insertDocument);
    
    // Get the newly created document by filename (since it should be unique)
    let query = db.select().from(documents)
      .where(eq(documents.fileName, insertDocument.fileName))
      .orderBy(desc(documents.createdAt))
      .limit(1);
    
    // Add userId condition only if userId is not null
    if (insertDocument.userId !== null) {
      query = query.where(eq(documents.userId, insertDocument.userId));
    }
    
    const [document] = await query;
    return document;
  }

  async updateDocumentCustomizations(id: number, customizations: any): Promise<Document> {
    await db
      .update(documents)
      .set({ 
        customizations: JSON.stringify(customizations),
        isModified: true 
      })
      .where(eq(documents.id, id));
    
    const [updatedDocument] = await db.select().from(documents).where(eq(documents.id, id));
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
    const [result] = await db
      .insert(templates)
      .values(insertTemplate);
    
    // Get the newly created template by name (since it should be unique for our use case)
    const [template] = await db.select().from(templates).where(eq(templates.name, insertTemplate.name));
    return template;
  }
}

export const storage = new DatabaseStorage();

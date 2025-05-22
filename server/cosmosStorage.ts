import { getContainer, CONTAINERS } from "./cosmos";
import { type User, type InsertUser, type Document, type InsertDocument, type Template, type InsertTemplate } from "@shared/schema";
import { Resource } from "@azure/cosmos";

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

export class CosmosDBStorage implements IStorage {
  // Helper function to generate IDs
  private async getNextId(containerName: string): Promise<number> {
    try {
      const container = await getContainer(containerName);
      const querySpec = {
        query: "SELECT VALUE MAX(c.id) FROM c"
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      const maxId = resources[0] || 0;
      return maxId + 1;
    } catch (error) {
      console.error(`Error getting next ID for ${containerName}:`, error);
      return 1; // Start with 1 if there's an error or no items exist
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const container = await getContainer(CONTAINERS.USERS);
      const { resource } = await container.item(String(id), String(id)).read();
      return resource || undefined;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const container = await getContainer(CONTAINERS.USERS);
      const querySpec = {
        query: "SELECT * FROM c WHERE c.username = @username",
        parameters: [{ name: "@username", value: username }]
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      return resources[0] || undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUserByLinkedinId(linkedinId: string): Promise<User | undefined> {
    try {
      const container = await getContainer(CONTAINERS.USERS);
      const querySpec = {
        query: "SELECT * FROM c WHERE c.linkedinId = @linkedinId",
        parameters: [{ name: "@linkedinId", value: linkedinId }]
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      return resources[0] || undefined;
    } catch (error) {
      console.error("Error getting user by LinkedIn ID:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const container = await getContainer(CONTAINERS.USERS);
      const id = await this.getNextId(CONTAINERS.USERS);
      
      const newUser: User = {
        ...insertUser,
        id
      };
      
      const { resource } = await container.items.create(newUser);
      return resource as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUserLinkedinToken(userId: number, token: string): Promise<User> {
    try {
      const container = await getContainer(CONTAINERS.USERS);
      const user = await this.getUser(userId);
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const updatedUser = {
        ...user,
        linkedinToken: token
      };
      
      const { resource } = await container.item(String(userId), String(userId)).replace(updatedUser);
      return resource as User;
    } catch (error) {
      console.error("Error updating user LinkedIn token:", error);
      throw error;
    }
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    try {
      const container = await getContainer(CONTAINERS.DOCUMENTS);
      const { resource } = await container.item(String(id), String(id)).read();
      return resource || undefined;
    } catch (error) {
      console.error("Error getting document by ID:", error);
      return undefined;
    }
  }

  async getRecentDocuments(userId: number): Promise<Document[]> {
    try {
      const container = await getContainer(CONTAINERS.DOCUMENTS);
      const querySpec = {
        query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
        parameters: [{ name: "@userId", value: userId }]
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      return resources;
    } catch (error) {
      console.error("Error getting recent documents:", error);
      return [];
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    try {
      const container = await getContainer(CONTAINERS.DOCUMENTS);
      const id = await this.getNextId(CONTAINERS.DOCUMENTS);
      
      const newDocument: Document = {
        ...insertDocument,
        id,
        createdAt: new Date().toISOString(),
        isModified: false
      };
      
      const { resource } = await container.items.create(newDocument);
      return resource as Document;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  async updateDocumentCustomizations(id: number, customizations: any): Promise<Document> {
    try {
      const container = await getContainer(CONTAINERS.DOCUMENTS);
      const document = await this.getDocument(id);
      
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }
      
      const updatedDocument = {
        ...document,
        customizations,
        isModified: true
      };
      
      const { resource } = await container.item(String(id), String(id)).replace(updatedDocument);
      return resource as Document;
    } catch (error) {
      console.error("Error updating document customizations:", error);
      throw error;
    }
  }

  // Template operations
  async getTemplate(id: number): Promise<Template | undefined> {
    try {
      const container = await getContainer(CONTAINERS.TEMPLATES);
      const { resource } = await container.item(String(id), String(id)).read();
      return resource || undefined;
    } catch (error) {
      console.error("Error getting template by ID:", error);
      return undefined;
    }
  }

  async getAllTemplates(): Promise<Template[]> {
    try {
      const container = await getContainer(CONTAINERS.TEMPLATES);
      const querySpec = {
        query: "SELECT * FROM c"
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      return resources;
    } catch (error) {
      console.error("Error getting all templates:", error);
      return [];
    }
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    try {
      const container = await getContainer(CONTAINERS.TEMPLATES);
      const id = await this.getNextId(CONTAINERS.TEMPLATES);
      
      const newTemplate: Template = {
        ...insertTemplate,
        id
      };
      
      const { resource } = await container.items.create(newTemplate);
      return resource as Template;
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  }
}

export const cosmosStorage = new CosmosDBStorage();
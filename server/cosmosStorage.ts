import { getContainer, CONTAINERS } from "./cosmos";
import { type User, type InsertUser, type Document, type InsertDocument, type Template, type InsertTemplate } from "@shared/schema";
import { Resource } from "@azure/cosmos";

// Type for mapping between our application types and Cosmos DB types
interface CosmosUser {
  id: string;
  numericId: number;
  username: string;
  password: string | null;
  email: string | null;
  linkedinId: string | null;
  linkedinToken: string | null;
  profilePicture: string | null;
  fullName: string | null;
}

interface CosmosDocument {
  id: string;
  numericId: number;
  userId: number | null;
  originalName: string;
  fileName: string;
  createdAt: string;
  isModified: boolean;
  customizations: any | null;
}

interface CosmosTemplate {
  id: string;
  numericId: number;
  name: string;
  imagePath: string;
  category: string;
}

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
        query: "SELECT VALUE MAX(c.numericId) FROM c"
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      const maxId = resources[0] || 0;
      return maxId + 1;
    } catch (error) {
      console.error(`Error getting next ID for ${containerName}:`, error);
      return 1; // Start with 1 if there's an error or no items exist
    }
  }

  // Helper functions to convert between app types and Cosmos types
  private toAppUser(cosmosUser: CosmosUser & Resource): User {
    const { id, numericId, ...rest } = cosmosUser;
    return {
      id: numericId,
      ...rest
    };
  }

  private toAppDocument(cosmosDoc: CosmosDocument & Resource): Document {
    const { id, numericId, createdAt, ...rest } = cosmosDoc;
    return {
      id: numericId,
      createdAt: new Date(createdAt),
      ...rest
    };
  }

  private toAppTemplate(cosmosTemplate: CosmosTemplate & Resource): Template {
    const { id, numericId, ...rest } = cosmosTemplate;
    return {
      id: numericId,
      ...rest
    };
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const container = await getContainer(CONTAINERS.USERS);
      const querySpec = {
        query: "SELECT * FROM c WHERE c.numericId = @id",
        parameters: [{ name: "@id", value: id }]
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      if (resources.length === 0) return undefined;
      
      return this.toAppUser(resources[0]);
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
      if (resources.length === 0) return undefined;
      
      return this.toAppUser(resources[0]);
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
      if (resources.length === 0) return undefined;
      
      return this.toAppUser(resources[0]);
    } catch (error) {
      console.error("Error getting user by LinkedIn ID:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const container = await getContainer(CONTAINERS.USERS);
      const numericId = await this.getNextId(CONTAINERS.USERS);
      
      const cosmosUser: CosmosUser = {
        id: String(numericId),
        numericId,
        username: insertUser.username,
        password: insertUser.password || null,
        email: insertUser.email || null,
        linkedinId: insertUser.linkedinId || null,
        linkedinToken: insertUser.linkedinToken || null,
        profilePicture: insertUser.profilePicture || null,
        fullName: insertUser.fullName || null
      };
      
      const { resource } = await container.items.create(cosmosUser);
      if (!resource) throw new Error("Failed to create user");
      
      return this.toAppUser(resource as CosmosUser & Resource);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUserLinkedinToken(userId: number, token: string): Promise<User> {
    try {
      const container = await getContainer(CONTAINERS.USERS);
      const querySpec = {
        query: "SELECT * FROM c WHERE c.numericId = @id",
        parameters: [{ name: "@id", value: userId }]
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      if (resources.length === 0) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const cosmosUser = resources[0] as CosmosUser & Resource;
      const updatedCosmosUser = {
        ...cosmosUser,
        linkedinToken: token
      };
      
      const { resource } = await container.item(cosmosUser.id).replace(updatedCosmosUser);
      if (!resource) throw new Error("Failed to update user");
      
      return this.toAppUser(resource as CosmosUser & Resource);
    } catch (error) {
      console.error("Error updating user LinkedIn token:", error);
      throw error;
    }
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    try {
      const container = await getContainer(CONTAINERS.DOCUMENTS);
      const querySpec = {
        query: "SELECT * FROM c WHERE c.numericId = @id",
        parameters: [{ name: "@id", value: id }]
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      if (resources.length === 0) return undefined;
      
      return this.toAppDocument(resources[0]);
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
      return resources.map(doc => this.toAppDocument(doc));
    } catch (error) {
      console.error("Error getting recent documents:", error);
      return [];
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    try {
      const container = await getContainer(CONTAINERS.DOCUMENTS);
      const numericId = await this.getNextId(CONTAINERS.DOCUMENTS);
      
      const cosmosDocument: CosmosDocument = {
        id: String(numericId),
        numericId,
        userId: insertDocument.userId || null,
        originalName: insertDocument.originalName,
        fileName: insertDocument.fileName,
        createdAt: new Date().toISOString(),
        isModified: false,
        customizations: insertDocument.customizations || null
      };
      
      const { resource } = await container.items.create(cosmosDocument);
      if (!resource) throw new Error("Failed to create document");
      
      return this.toAppDocument(resource as CosmosDocument & Resource);
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  async updateDocumentCustomizations(id: number, customizations: any): Promise<Document> {
    try {
      const container = await getContainer(CONTAINERS.DOCUMENTS);
      const querySpec = {
        query: "SELECT * FROM c WHERE c.numericId = @id",
        parameters: [{ name: "@id", value: id }]
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      if (resources.length === 0) {
        throw new Error(`Document with ID ${id} not found`);
      }
      
      const cosmosDocument = resources[0] as CosmosDocument & Resource;
      const updatedCosmosDocument = {
        ...cosmosDocument,
        customizations,
        isModified: true
      };
      
      const { resource } = await container.item(cosmosDocument.id).replace(updatedCosmosDocument);
      if (!resource) throw new Error("Failed to update document");
      
      return this.toAppDocument(resource as CosmosDocument & Resource);
    } catch (error) {
      console.error("Error updating document customizations:", error);
      throw error;
    }
  }

  // Template operations
  async getTemplate(id: number): Promise<Template | undefined> {
    try {
      const container = await getContainer(CONTAINERS.TEMPLATES);
      const querySpec = {
        query: "SELECT * FROM c WHERE c.numericId = @id",
        parameters: [{ name: "@id", value: id }]
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();
      if (resources.length === 0) return undefined;
      
      return this.toAppTemplate(resources[0]);
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
      return resources.map(template => this.toAppTemplate(template));
    } catch (error) {
      console.error("Error getting all templates:", error);
      return [];
    }
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    try {
      const container = await getContainer(CONTAINERS.TEMPLATES);
      const numericId = await this.getNextId(CONTAINERS.TEMPLATES);
      
      const cosmosTemplate: CosmosTemplate = {
        id: String(numericId),
        numericId,
        ...insertTemplate
      };
      
      const { resource } = await container.items.create(cosmosTemplate);
      if (!resource) throw new Error("Failed to create template");
      
      return this.toAppTemplate(resource as CosmosTemplate & Resource);
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  }
}

export const cosmosStorage = new CosmosDBStorage();
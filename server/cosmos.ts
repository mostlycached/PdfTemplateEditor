import { CosmosClient } from "@azure/cosmos";

// Check if Azure Cosmos DB credentials are provided
if (!process.env.AZURE_COSMOS_ENDPOINT || !process.env.AZURE_COSMOS_KEY) {
  throw new Error(
    "AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY must be set. Did you forget to provide the Cosmos DB credentials?"
  );
}

// Database and container names
export const DATABASE_NAME = "pdfenhancer";
export const CONTAINERS = {
  USERS: "users",
  DOCUMENTS: "documents",
  TEMPLATES: "templates"
};

// Create the CosmosClient instance
export const cosmosClient = new CosmosClient({
  endpoint: process.env.AZURE_COSMOS_ENDPOINT,
  key: process.env.AZURE_COSMOS_KEY
});

// Initialize database and containers
export async function initializeCosmosDB() {
  console.log("Initializing Cosmos DB...");
  
  try {
    // Create database if it doesn't exist
    const { database } = await cosmosClient.databases.createIfNotExists({
      id: DATABASE_NAME
    });
    console.log(`Database '${DATABASE_NAME}' initialized`);

    // Create containers if they don't exist
    await Promise.all(
      Object.values(CONTAINERS).map(async (containerId) => {
        const { container } = await database.containers.createIfNotExists({
          id: containerId,
          partitionKey: { paths: ["/id"] }
        });
        console.log(`Container '${containerId}' initialized`);
        return container;
      })
    );

    console.log("Cosmos DB initialization complete");
  } catch (error) {
    console.error("Error initializing Cosmos DB:", error);
    throw error;
  }
}

// Get database reference
export const getDatabase = async () => {
  return cosmosClient.database(DATABASE_NAME);
};

// Get container reference
export const getContainer = async (containerId: string) => {
  const database = await getDatabase();
  return database.container(containerId);
};
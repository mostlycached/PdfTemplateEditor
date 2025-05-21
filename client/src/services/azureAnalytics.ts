import { 
  TextAnalyticsClient, 
  AzureKeyCredential,
  ExtractKeyPhrasesSuccessResult,
  RecognizeEntitiesSuccessResult,
  CategorizedEntity
} from "@azure/ai-text-analytics";

export interface LinkedInOptimizedContent {
  title: string;
  subtitle: string;
  presenter: string;
  keyPhrases: string[];
  professionalSummary: string;
}

class AzureAnalyticsService {
  private client: TextAnalyticsClient | null = null;

  initialize(apiKey: string, endpoint: string) {
    if (!apiKey || !endpoint) {
      console.error("Azure Text Analytics API key or endpoint not provided");
      return false;
    }

    try {
      this.client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(apiKey));
      return true;
    } catch (error) {
      console.error("Failed to initialize Azure Text Analytics client:", error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.client !== null;
  }

  async analyzeTextForLinkedIn(text: string): Promise<LinkedInOptimizedContent | null> {
    if (!this.client) {
      console.error("Azure Text Analytics client not initialized");
      return null;
    }

    try {
      // Prepare a result object with default values
      const result: LinkedInOptimizedContent = {
        title: "",
        subtitle: "",
        presenter: "",
        keyPhrases: [],
        professionalSummary: ""
      };

      // Extract key phrases to identify potential title and subtitle
      const keyPhrasesResults = await this.client.extractKeyPhrases([{ id: "1", text }]);
      
      // Check if we have successful results and process them
      if (keyPhrasesResults && keyPhrasesResults.length > 0) {
        const keyPhrasesResult = keyPhrasesResults[0];
        
        if (keyPhrasesResult.error === undefined) {
          // Cast to success result type to access the keyPhrases property
          const successResult = keyPhrasesResult as ExtractKeyPhrasesSuccessResult;
          result.keyPhrases = successResult.keyPhrases.slice(0, 10);
          
          // Use first key phrase as title if it's substantive enough (more than 3 words)
          const potentialTitles = result.keyPhrases
            .filter(phrase => phrase.split(" ").length >= 3 && phrase.length <= 50);
          
          if (potentialTitles.length > 0) {
            result.title = potentialTitles[0];
            // Use second phrase as subtitle if available
            if (potentialTitles.length > 1) {
              result.subtitle = potentialTitles[1];
            }
          } else if (result.keyPhrases.length > 0) {
            // Fallback to first key phrase even if it's short
            result.title = result.keyPhrases[0];
          }
        }
      }

      // Extract entities to find potential presenter names (people)
      const entitiesResults = await this.client.recognizeEntities([{ id: "1", text }]);
      
      if (entitiesResults && entitiesResults.length > 0) {
        const entitiesResult = entitiesResults[0];
        
        if (entitiesResult.error === undefined) {
          // Cast to success result type to access the entities property
          const successResult = entitiesResult as RecognizeEntitiesSuccessResult;
          
          const people = successResult.entities
            .filter((entity: CategorizedEntity) => entity.category === "Person")
            .map((entity: CategorizedEntity) => entity.text);
          
          if (people.length > 0) {
            result.presenter = people[0]; // Use the first person mentioned
          }
        }
      }

      // For generating a professional summary, we'll use the key phrases to create one
      // since extractSummary is not part of the current API
      if (result.keyPhrases.length > 0) {
        const keyPhrasesSummary = result.keyPhrases.join(", ");
        result.professionalSummary = `This document discusses ${keyPhrasesSummary}. It provides valuable insights for professionals interested in these topics.`.substring(0, 200);
      } else {
        // Default professional summary
        result.professionalSummary = "A professional document optimized for LinkedIn sharing.";
      }

      return result;
    } catch (error) {
      console.error("Error analyzing text with Azure Cognitive Services:", error);
      return null;
    }
  }
}

// Singleton instance
export const azureAnalyticsService = new AzureAnalyticsService();
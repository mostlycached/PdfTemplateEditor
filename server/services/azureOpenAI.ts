import axios from 'axios';

interface LinkedInOptimizedSuggestions {
  title: string;
  subtitle: string;
  presenter: string;
  professionalSummary: string;
  keyPhrases: string[];
}

/**
 * Analyzes PDF text content using Azure OpenAI to generate LinkedIn-optimized suggestions
 */
export async function analyzeWithAzureOpenAI(
  text: string,
  apiKey: string,
  endpoint: string
): Promise<LinkedInOptimizedSuggestions> {
  try {
    // Ensure endpoint is properly formatted (no trailing slash)
    const baseEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const apiVersion = '2023-05-15'; // Update this to the current Azure OpenAI API version
    
    // Construct the messages for the API call
    const systemMessage = "You are an AI assistant specializing in optimizing content for LinkedIn sharing. " +
      "Analyze the given text and extract or generate the following elements optimized for professional LinkedIn sharing: " +
      "1. A compelling title (max 50 chars) " +
      "2. An engaging subtitle (max 80 chars) " +
      "3. The presenter name (if found in text) " +
      "4. A professional summary (max 200 chars) " +
      "5. 5-7 key phrases or topics from the content " +
      "Respond in JSON format with these fields: title, subtitle, presenter, professionalSummary, keyPhrases (array).";

    const userMessage = `Please analyze the following PDF content and generate LinkedIn-optimized suggestions:\n\n${text}`;

    const messages = [
      {
        role: "system",
        content: systemMessage
      },
      {
        role: "user",
        content: userMessage
      }
    ];

    // Log the final prompt being sent to OpenAI
    console.log('=== AZURE OPENAI PROMPT ===');
    console.log('System Message:', systemMessage);
    console.log('User Message:', userMessage);
    console.log('Full Messages Array:', JSON.stringify(messages, null, 2));
    console.log('=== END PROMPT ===');

    // Use Azure OpenAI's GPT model to generate content
    const response = await axios.post(
      `${baseEndpoint}/openai/deployments/gpt-4o/chat/completions?api-version=${apiVersion}`,
      {
        messages,
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse the response
    const assistantMessage = response.data.choices[0]?.message?.content;
    if (!assistantMessage) {
      throw new Error('No valid response from Azure OpenAI');
    }

    // Parse JSON from the response
    const parsedResponse = JSON.parse(assistantMessage);
    
    return {
      title: parsedResponse.title || "Professional Presentation",
      subtitle: parsedResponse.subtitle || "Industry Insights & Analysis",
      presenter: parsedResponse.presenter || "",
      professionalSummary: parsedResponse.professionalSummary || "",
      keyPhrases: Array.isArray(parsedResponse.keyPhrases) ? parsedResponse.keyPhrases : []
    };
  } catch (error: any) {
    console.error('Azure OpenAI analysis error:', error.response?.data || error.message);
    
    // Return default values if there's an error
    return {
      title: "Professional Presentation",
      subtitle: "Industry Insights & Analysis",
      presenter: "",
      professionalSummary: "Content analysis powered by Azure AI",
      keyPhrases: []
    };
  }
}
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { PDFCustomizations } from './CustomizationPanel';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AzureAnalysisButtonProps {
  documentId: number;
  onAnalysisComplete: (suggestions: PDFCustomizations) => void;
}

export default function AzureAnalysisButton({ documentId, onAnalysisComplete }: AzureAnalysisButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const { mutate: analyzeDocument } = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      try {
        // The issue might be with how we're handling the response
        const response = await apiRequest("GET", `/api/documents/${documentId}/analyze`);
        
        // Log the raw response to see what we're getting
        console.log("Raw API response:", response);
        
        // Handle both Response object and parsed JSON
        if (response instanceof Response) {
          const json = await response.json();
          return json;
        }
        
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      console.log("Azure OpenAI analysis response:", data);
      if (data.suggestedValues) {
        toast({
          title: "Document analyzed successfully",
          description: "LinkedIn-optimized values have been applied to your template",
          duration: 3000,
        });
        
        // Ensure we apply the suggestions - log them as well
        console.log("Suggested template values:", data.suggestedValues);
        onAnalysisComplete(data.suggestedValues);
      } else {
        console.error("Missing suggestedValues in response:", data);
        toast({
          title: "Analysis incomplete",
          description: "Couldn't get LinkedIn suggestions. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
    },
    onError: (error: any) => {
      if (error.data?.missingCredentials) {
        toast({
          title: "Azure API key required",
          description: "Please add your Azure Text Analytics API key in the environment variables to use this feature.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Analysis failed",
          description: error.message || "Failed to analyze the document. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
  });

  return (
    <Button
      onClick={() => analyzeDocument()}
      disabled={isLoading}
      variant="outline"
      className="w-full mb-4 border-[#0077B5] text-[#0077B5] hover:bg-[#0077B5] hover:text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Analyzing with Azure OpenAI...
        </>
      ) : (
        <>
          <BrainCircuit className="h-4 w-4 mr-2" />
          Optimize for LinkedIn with Azure GPT
        </>
      )}
    </Button>
  );
}
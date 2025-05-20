import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/components/AuthContext';
import PDFPreview from '@/components/PDFPreview';
import TemplateSelection from '@/components/TemplateSelection';
import CustomizationPanel, { PDFCustomizations } from '@/components/CustomizationPanel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Share2, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Template, Document } from '@shared/schema';
import { SiLinkedin } from 'react-icons/si';

export default function Editor() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const documentId = params.get('id');
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>();
  const [customizations, setCustomizations] = useState<PDFCustomizations | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customizedCoverPageUrl, setCustomizedCoverPageUrl] = useState<string | null>(null);

  // Fetch document details
  const { data: document, isLoading: isDocumentLoading } = useQuery<Document>({
    queryKey: ['/api/documents', documentId],
    enabled: !!documentId,
  });

  // Apply template and customizations
  const { mutate: applyChanges, isPending: isApplying } = useMutation({
    mutationFn: async () => {
      if (!documentId || !selectedTemplateId || !customizations) {
        throw new Error("Missing required data");
      }
      
      const response = await apiRequest("POST", `/api/documents/${documentId}/customize`, {
        templateId: selectedTemplateId,
        customizations
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      setCustomizedCoverPageUrl(data.previewUrl);
      toast({
        title: "Changes applied successfully",
        duration: 3000,
      });
      
      // Invalidate document query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to apply changes",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  // Download PDF
  const { mutate: downloadPdf, isPending: isDownloading } = useMutation({
    mutationFn: async () => {
      if (!documentId) {
        throw new Error("Document ID is required");
      }
      
      const response = await fetch(`/api/documents/${documentId}/download`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = document?.originalName || 'enhanced-presentation.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  // Share to LinkedIn
  const { mutate: shareToLinkedIn, isPending: isSharing } = useMutation({
    mutationFn: async () => {
      if (!documentId) {
        throw new Error("Document ID is required");
      }
      
      await apiRequest("POST", `/api/documents/${documentId}/share-linkedin`, {});
    },
    onSuccess: () => {
      toast({
        title: "Shared to LinkedIn successfully",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Share failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  // Set preview URL when document is loaded
  useEffect(() => {
    if (document) {
      setPreviewUrl(`/api/documents/${document.id}/preview`);
      
      // If document has customizations, set them
      if (document.customizations) {
        const docCustomizations = JSON.parse(document.customizations as string);
        setCustomizations(docCustomizations);
        if (docCustomizations.templateId) {
          setSelectedTemplateId(docCustomizations.templateId);
        }
      }
    }
  }, [document]);

  // Redirect to home if no document ID
  useEffect(() => {
    if (!documentId) {
      setLocation('/');
    }
  }, [documentId, setLocation]);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
  };

  const handleCustomizationChange = (newCustomizations: PDFCustomizations) => {
    setCustomizations(newCustomizations);
  };

  const handleApplyChanges = () => {
    applyChanges();
  };

  if (isDocumentLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 text-[#0077B5] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Presentation | PresentPro</title>
        <meta name="description" content="Customize your presentation with professional templates and design options." />
      </Helmet>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left panel - Preview and templates */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-neutral-900">Preview</h2>
                <div className="flex space-x-2">
                  <Button
                    variant="default"
                    className="bg-[#0077B5] hover:bg-[#006195] flex items-center"
                    onClick={() => downloadPdf()}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                  
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      className="text-[#0077B5] border-[#0077B5] hover:bg-[#E8F4F9] flex items-center"
                      onClick={() => shareToLinkedIn()}
                      disabled={isSharing}
                    >
                      {isSharing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <SiLinkedin className="h-4 w-4 mr-2" />
                      )}
                      Share to LinkedIn
                    </Button>
                  )}
                </div>
              </div>
              
              {previewUrl && (
                <PDFPreview 
                  pdfUrl={previewUrl} 
                  customizedCoverPage={customizedCoverPageUrl} 
                />
              )}
            </div>
            
            <TemplateSelection 
              onSelectTemplate={handleSelectTemplate} 
              selectedTemplateId={selectedTemplateId}
            />
          </div>
          
          {/* Right panel - Customization options */}
          <div className="w-full lg:w-1/3">
            {selectedTemplateId && customizations && (
              <CustomizationPanel 
                templateId={selectedTemplateId}
                onCustomizationChange={handleCustomizationChange}
                onApplyChanges={handleApplyChanges}
                initialCustomizations={customizations}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}

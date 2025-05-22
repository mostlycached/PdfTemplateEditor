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
import { Download, Share2, Loader2, Info, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Template, Document } from '@shared/schema';
import { SiLinkedin } from 'react-icons/si';
import { OnboardingTooltip, OnboardingStep } from '@/components/OnboardingTooltip';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';

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
  const [currentStep, setCurrentStep] = useState<'template' | 'customize' | 'preview'>('template');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

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
      
      // The apiRequest function already returns the JSON parsed data
      return await apiRequest("POST", `/api/documents/${documentId}/customize`, {
        templateId: selectedTemplateId,
        customizations
      });
    },
    onSuccess: (data) => {
      if (data && data.previewUrl) {
        setCustomizedCoverPageUrl(data.previewUrl);
      } else if (data && data.coverPreviewUrl) {
        setCustomizedCoverPageUrl(data.coverPreviewUrl);
      }
      
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
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document?.originalName || 'enhanced-presentation.pdf';
      window.document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
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
      setPreviewUrl(`/api/documents/${document.id}/preview?t=${Date.now()}`);
      
      // Set the customized cover page URL if document has been customized
      if (document.isModified) {
        setCustomizedCoverPageUrl(`/api/documents/${document.id}/cover-preview?t=${Date.now()}`);
        setCurrentStep('preview');
      }
      
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

  // Onboarding steps for guiding users
  const onboardingSteps: OnboardingStep[] = [
    {
      targetId: "template-selection-section",
      title: "Step 1: Choose a Template",
      content: "Start by selecting a template that best matches your presentation style.",
      position: "bottom"
    },
    {
      targetId: "customization-panel",
      title: "Step 2: Customize Your Cover",
      content: "Personalize your cover page with your own title, name, and style preferences.",
      position: "left"
    },
    {
      targetId: "preview-section",
      title: "Step 3: Preview and Download",
      content: "Preview your enhanced PDF and download it when you're satisfied with the result.",
      position: "top"
    }
  ];

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    
    // Initialize customizations if they don't exist yet
    if (!customizations) {
      setCustomizations({
        title: "Presentation Title",
        subtitle: "Subtitle or Tagline",
        presenter: "",
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        colorScheme: '#0077B5',
        fontFamily: 'Roboto',
        titleSize: 'Medium',
        titleAlignment: 'center',
        backgroundStyle: 'gradient1',
        backgroundOpacity: 100
      });
    }
    
    // Move to next step after selecting template
    setCurrentStep('customize');
  };

  const handleCustomizationChange = (newCustomizations: PDFCustomizations) => {
    setCustomizations(newCustomizations);
  };

  const handleApplyChanges = () => {
    if (selectedTemplateId && customizations) {
      // Track the document ID we're customizing
      const currentDocId = documentId;
      
      // Show feedback to user while changes are being applied
      setShowFeedback(true);
      
      // Call the API to apply customizations
      applyChanges();
      
      // Set a timeout to update UI and hide feedback
      setTimeout(() => {
        setShowFeedback(false);
        
        // If the document ID is still the same, proceed with UI updates
        if (currentDocId === documentId) {
          // Move to preview step after applying changes
          setCurrentStep('preview');
          
          // Force refresh preview URL to ensure the latest version is shown
          if (documentId) {
            setCustomizedCoverPageUrl(`/api/documents/${documentId}/cover-preview?t=${Date.now()}`);
          }
        }
      }, 2000);
    } else {
      toast({
        title: "Missing information",
        description: "Please select a template and complete customizations before applying changes.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Handle onboarding completion
  const handleOnboardingFinish = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboardingCompleted', 'true');
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
        {/* Breadcrumb navigation */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Editor</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'template' ? 'bg-[#0077B5] text-white' : 'bg-[#E8F4F9] text-[#0077B5] border border-[#0077B5]'}`}>
                1
              </div>
              <div className="h-1 w-16 mx-1 bg-gray-200">
                <div className={`h-full bg-[#0077B5] transition-all duration-300 ${currentStep !== 'template' ? 'w-full' : 'w-0'}`}></div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'customize' ? 'bg-[#0077B5] text-white' : currentStep === 'template' ? 'bg-gray-100 text-gray-400 border border-gray-200' : 'bg-[#E8F4F9] text-[#0077B5] border border-[#0077B5]'}`}>
                2
              </div>
              <div className="h-1 w-16 mx-1 bg-gray-200">
                <div className={`h-full bg-[#0077B5] transition-all duration-300 ${currentStep === 'preview' ? 'w-full' : 'w-0'}`}></div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-[#0077B5] text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                3
              </div>
            </div>
          </div>
          
          <div className="flex justify-center text-sm">
            <div className="flex space-x-12">
              <div className={`text-center w-24 ${currentStep === 'template' ? 'text-[#0077B5] font-medium' : 'text-gray-600'}`}>
                Choose Template
              </div>
              <div className={`text-center w-24 ${currentStep === 'customize' ? 'text-[#0077B5] font-medium' : 'text-gray-600'}`}>
                Customize
              </div>
              <div className={`text-center w-24 ${currentStep === 'preview' ? 'text-[#0077B5] font-medium' : 'text-gray-600'}`}>
                Preview & Download
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content area with applied visual hierarchy */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left panel - Preview and templates */}
          <div className="w-full lg:w-2/3">
            {/* Preview section */}
            <div id="preview-section" className={`bg-white rounded-lg shadow-sm border ${customizedCoverPageUrl ? 'border-[#0077B5]' : 'border-gray-100'} p-6 mb-6 transition-all duration-300`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-neutral-900">
                  Preview
                  {showFeedback && (
                    <span className="ml-2 inline-flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" /> Changes applied!
                    </span>
                  )}
                </h2>
                <div className="flex space-x-2">
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      className="text-[#0077B5] border-[#0077B5] hover:bg-[#E8F4F9] flex items-center"
                      onClick={() => shareToLinkedIn()}
                      disabled={isSharing}
                      aria-label="Share to LinkedIn"
                    >
                      {isSharing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      ) : (
                        <SiLinkedin className="h-4 w-4 mr-2" aria-hidden="true" />
                      )}
                      Share to LinkedIn
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {/* Enhanced PDF panel */}
                <div className="bg-white rounded-lg p-6 border border-[#0077B5]">
                  <div className="mb-4 text-center">
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded">ENHANCED PDF</span>
                  </div>
                  
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    {customizedCoverPageUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <a 
                          href={customizedCoverPageUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mb-4"
                        >
                          <img 
                            src={customizedCoverPageUrl} 
                            alt="Enhanced PDF preview" 
                            className="max-h-64 object-contain"
                            onError={(e) => e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDc3QjUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1maWxlLXRleHQiPjxwYXRoIGQ9Ik0xNC41IDJINmEyIDIgMCAwIDAtMiAydjE2YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMlY3LjVMOS45IDR6Ii8+PHBvbHlsaW5lIHBvaW50cz0iMTQgMiAxNCAxMCAyMiAxMCIvPjxwYXRoIGQ9Ik0xNiAxM0g4Ii8+PHBhdGggZD0iTTE2IDE3SDgiLz48cGF0aCBkPSJNMTAgOUg4Ii8+PC9zdmc+'}
                          />
                        </a>
                        
                        <Button
                          variant="default"
                          className="bg-[#0077B5] hover:bg-[#006195] text-white flex items-center"
                          onClick={() => downloadPdf()}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download Enhanced PDF
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-neutral-500">
                        <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-600">Apply customizations to see your enhanced PDF</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {!customizedCoverPageUrl && (
                <div className="text-center py-4 text-neutral-500 border-t border-dashed border-gray-200 mt-4">
                  <Info className="h-5 w-5 mx-auto mb-2 text-[#0077B5]" />
                  <p>Select a template and apply customizations to see your enhanced cover page</p>
                </div>
              )}
            </div>
            
            {/* Template selection section */}
            <div id="template-selection-section" className="mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-2">
                <h2 className="text-lg font-medium text-neutral-900 mb-2 flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0077B5] text-white text-xs mr-2">1</span>
                  Select a Template
                </h2>
                <p className="text-sm text-neutral-600 mb-4">Choose a template that matches your presentation style</p>
              </div>
              
              <TemplateSelection 
                onSelectTemplate={handleSelectTemplate} 
                selectedTemplateId={selectedTemplateId}
              />
            </div>
          </div>
          
          {/* Right panel - Customization options with improved visuals */}
          <div id="customization-panel" className="w-full lg:w-1/3">
            {selectedTemplateId && customizations ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-2">
                <h2 className="text-lg font-medium text-neutral-900 mb-2 flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0077B5] text-white text-xs mr-2">2</span>
                  Customize Cover Page
                </h2>
                <p className="text-sm text-neutral-600 mb-4">Personalize your presentation with your information and style preferences</p>
              </div>
            ) : null}
            
            {selectedTemplateId && customizations && (
              <CustomizationPanel 
                templateId={selectedTemplateId}
                onCustomizationChange={handleCustomizationChange}
                onApplyChanges={handleApplyChanges}
                initialCustomizations={customizations}
              />
            )}
            
            {!selectedTemplateId && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                <div className="text-neutral-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 16.5v1.5m4-1.5v1.5m4-1.5v1.5M5.2 6h13.6a.2.2 0 01.2.2v7.6a.2.2 0 01-.2.2H5.2a.2.2 0 01-.2-.2V6.2a.2.2 0 01.2-.2z" />
                  </svg>
                  <h3 className="font-medium mb-2">No Template Selected</h3>
                  <p className="text-sm">Please select a template from the options below to customize your cover page</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Onboarding tooltip for guided tour experience */}
      <OnboardingTooltip 
        steps={onboardingSteps}
        isOpen={showOnboarding && !!documentId}
        onFinish={handleOnboardingFinish}
        onDismiss={handleOnboardingFinish}
      />
    </>
  );
}

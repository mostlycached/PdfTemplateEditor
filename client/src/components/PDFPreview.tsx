import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// Set worker path to CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  pdfUrl: string;
  customizedCoverPage?: string | null;
  showSideBySide?: boolean;
}

export default function PDFPreview({ pdfUrl, customizedCoverPage, showSideBySide = true }: PDFPreviewProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [originalCoverLoading, setOriginalCoverLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  // Render current page for pagination view
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      
      try {
        // Don't render again if we're showing the cover page side by side
        if (currentPage === 1 && customizedCoverPage && showSideBySide) {
          return;
        }

        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: canvas.getContext('2d')!,
          viewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, customizedCoverPage, showSideBySide]);

  // Render the original cover page for side-by-side view
  useEffect(() => {
    const renderOriginalCover = async () => {
      if (!pdfDoc || !originalCanvasRef.current || !customizedCoverPage || !showSideBySide || currentPage !== 1) return;
      
      try {
        setOriginalCoverLoading(true);
        const page = await pdfDoc.getPage(1); // Get first page
        const viewport = page.getViewport({ scale: 1.2 });
        
        const canvas = originalCanvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: canvas.getContext('2d')!,
          viewport,
        };

        await page.render(renderContext).promise;
        setOriginalCoverLoading(false);
      } catch (error) {
        console.error('Error rendering original cover:', error);
        setOriginalCoverLoading(false);
      }
    };

    renderOriginalCover();
  }, [pdfDoc, customizedCoverPage, showSideBySide, currentPage]);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Render side-by-side view (original and enhanced)
  const renderSideBySideView = () => {
    if (loading) {
      return (
        <div className="w-full flex justify-center items-center" style={{ height: '400px' }}>
          <Loader2 className="h-8 w-8 text-[#0077B5] animate-spin" />
        </div>
      );
    }

    return (
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Original PDF panel */}
        <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
          <div className="mb-2 text-center">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">ORIGINAL</span>
          </div>
          <div className="flex items-center justify-center h-[350px] overflow-hidden">
            <embed 
              src={pdfUrl}
              type="application/pdf"
              className="w-full h-full rounded-md"
            />
          </div>
        </div>

        <div className="flex items-center justify-center -mx-2 -my-2 hidden md:block">
          <div className="bg-[#0077B5] rounded-full p-2">
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Enhanced PDF panel */}
        <div className="flex-1 bg-white rounded-lg p-4 border-2 border-[#0077B5]">
          <div className="mb-2 text-center">
            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">ENHANCED</span>
          </div>
          <div className="flex items-center justify-center h-[350px] overflow-hidden">
            {customizedCoverPage ? (
              <embed 
                src={customizedCoverPage}
                type="application/pdf"
                className="w-full h-full rounded-md"
              />
            ) : (
              <div className="text-center py-4 text-neutral-500 h-full flex flex-col justify-center items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Apply customizations to see your enhanced cover page</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Standard PDF viewer for pagination
  const renderStandardView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 text-[#0077B5] animate-spin" />
        </div>
      );
    }
    
    if (currentPage === 1 && customizedCoverPage) {
      return (
        <embed
          src={customizedCoverPage}
          type="application/pdf"
          className="w-full h-[400px] rounded-md"
        />
      );
    }
    
    // Show the original PDF with page number
    return (
      <embed
        src={pdfUrl}
        type="application/pdf"
        className="w-full h-[400px] rounded-md"
      />
    );
  };

  return (
    <div className="relative bg-neutral-50 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
      <div className="w-full h-full p-4" id="pdf-preview">
        {currentPage === 1 && customizedCoverPage && showSideBySide
          ? renderSideBySideView()
          : renderStandardView()
        }
      </div>
      
      {totalPages > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white px-4 py-2 rounded-full shadow">
          <button 
            className={`text-neutral-600 hover:text-neutral-900 transition-colors duration-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-neutral-900">Page <span id="current-page">{currentPage}</span> of <span id="total-pages">{totalPages}</span></span>
          <button 
            className={`text-neutral-600 hover:text-neutral-900 transition-colors duration-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

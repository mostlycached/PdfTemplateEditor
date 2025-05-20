import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// Set worker path to CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  pdfUrl: string;
  customizedCoverPage?: string | null;
}

export default function PDFPreview({ pdfUrl, customizedCoverPage }: PDFPreviewProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
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
  }, [pdfDoc, currentPage]);

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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 text-[#0077B5] animate-spin" />
        </div>
      );
    }
    
    if (currentPage === 1 && customizedCoverPage) {
      // For PDF cover pages
      if (customizedCoverPage.endsWith('.pdf')) {
        return (
          <object 
            data={customizedCoverPage} 
            type="application/pdf" 
            className="w-full h-[400px]"
          >
            <p>Your browser doesn't support PDF previews.</p>
          </object>
        );
      }
      
      // For image cover pages
      return (
        <img 
          src={customizedCoverPage} 
          alt="Customized cover page" 
          className="max-w-full max-h-full rounded-md shadow"
        />
      );
    }
    
    return (
      <canvas ref={canvasRef} className="max-w-full max-h-full rounded-md shadow" />
    );
  };

  return (
    <div className="relative bg-neutral-50 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
      <div className="w-full h-full flex items-center justify-center p-4" id="pdf-preview">
        {renderContent()}
      </div>
      
      {totalPages > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white px-4 py-2 rounded-full shadow">
          <button 
            className={`text-neutral-600 hover:text-neutral-900 transition-colors duration-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={goToPrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-neutral-900">Page <span id="current-page">{currentPage}</span> of <span id="total-pages">{totalPages}</span></span>
          <button 
            className={`text-neutral-600 hover:text-neutral-900 transition-colors duration-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

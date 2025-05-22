import { Helmet } from 'react-helmet';
import UploadArea from '@/components/UploadArea';
import FeaturesOverview from '@/components/FeaturesOverview';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Zap, Clock } from 'lucide-react';
import { Link } from 'wouter';

export default function Home() {
  return (
    <>
      <Helmet>
        <title>PresentPro - Transform PDFs into Professional Presentations</title>
        <meta name="description" content="Transform ordinary PDFs into professional presentations in seconds with custom cover pages - no design skills needed." />
        <meta property="og:title" content="PresentPro - Transform PDFs into Professional Presentations" />
        <meta property="og:description" content="Transform your presentations with professional cover pages in just a few clicks - no design skills needed." />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero section with visual demonstration */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12 bg-gradient-to-r from-[#E8F4F9] to-white rounded-xl p-8 border border-[#e1f0f7]">
          <div className="lg:w-1/2">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Transform <span className="text-[#0077B5]">Ordinary PDFs</span> into Professional Presentations
            </h1>
            <p className="text-lg text-neutral-700 mb-6">
              Enhance your document's first impression in seconds - no design skills needed.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-start">
                <div className="bg-[#0077B5] p-2 rounded-full text-white mr-3 mt-1">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">One-Click Enhancement</h3>
                  <p className="text-sm text-neutral-600">Perfect for client proposals and presentations</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-[#0077B5] p-2 rounded-full text-white mr-3 mt-1">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">Save Hours of Design Time</h3>
                  <p className="text-sm text-neutral-600">Ready-to-use professional templates</p>
                </div>
              </div>
            </div>
            
            <Button 
              className="bg-[#0077B5] hover:bg-[#006195] text-white px-6 py-3 rounded-md font-medium transition-colors duration-200"
              onClick={() => {
                const uploadSection = document.getElementById('upload-section');
                if (uploadSection) {
                  uploadSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="lg:w-1/2 relative">
            <div className="bg-white rounded-lg shadow-lg p-4 transform -rotate-2 border-2 border-gray-100 mb-4">
              <div className="bg-gray-100 p-3 rounded">
                <div className="h-8 w-2/3 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-full bg-gray-300 rounded mb-1"></div>
                <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4 transform rotate-1 border-2 border-[#0077B5]">
              <div className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] p-3 rounded">
                <div className="h-8 w-2/3 bg-white bg-opacity-90 rounded mb-2"></div>
                <div className="h-4 w-full bg-white bg-opacity-80 rounded mb-1"></div>
                <div className="h-4 w-1/2 bg-white bg-opacity-80 rounded"></div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 bg-yellow-100 text-yellow-800 text-sm font-bold py-1 px-3 rounded-full transform rotate-12 border border-yellow-200">
              AFTER
            </div>
            <div className="absolute -top-6 -left-6 bg-blue-100 text-blue-800 text-sm font-bold py-1 px-3 rounded-full transform -rotate-12 border border-blue-200">
              BEFORE
            </div>
          </div>
        </div>
        
        {/* How it works section */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">How It Works</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto mb-8">Three simple steps to transform your PDF presentations</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative">
              <div className="absolute -top-4 -left-4 bg-[#0077B5] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
              <div className="mb-4">
                <FileText className="h-10 w-10 text-[#0077B5] mx-auto" />
              </div>
              <h3 className="font-medium text-lg mb-2">Upload Your PDF</h3>
              <p className="text-neutral-600 text-sm">Drag & drop or browse to upload your existing PDF document</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative">
              <div className="absolute -top-4 -left-4 bg-[#0077B5] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#0077B5] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="font-medium text-lg mb-2">Select a Template</h3>
              <p className="text-neutral-600 text-sm">Choose from our collection of professional templates</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative">
              <div className="absolute -top-4 -left-4 bg-[#0077B5] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#0077B5] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-medium text-lg mb-2">Customize & Download</h3>
              <p className="text-neutral-600 text-sm">Personalize your cover page and download the enhanced PDF</p>
            </div>
          </div>
        </div>
        
        <div id="upload-section" className="pt-4">
          <UploadArea />
          <FeaturesOverview />
        </div>
      </main>
    </>
  );
}

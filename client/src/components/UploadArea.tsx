import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./AuthContext";
import { FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";

export default function UploadArea() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const { data: recentDocuments = [] } = useQuery<Document[]>({
    queryKey: ['/api/documents/recent'],
    enabled: isAuthenticated,
  });

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use fetch directly for FormData
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      
      // Navigate to the editor page with the document ID
      setLocation(`/editor?id=${data.documentId}`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div 
        className={`drag-area bg-white rounded-lg p-8 text-center transition-all duration-300 border-2 border-dashed ${
          isDragging ? 'border-[#0077B5] bg-[#E8F4F9]' : 'border-gray-200 hover:border-[#0077B5] hover:bg-[#E8F4F9]'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <FileText className="h-16 w-16 mx-auto text-[#0077B5] opacity-75 mb-4" />
        <h3 className="font-medium text-lg text-neutral-900 mb-2">Drag & drop your PDF file here</h3>
        <p className="text-neutral-600 mb-4">or</p>
        <label className="cursor-pointer">
          <span className="bg-[#0077B5] text-white py-2 px-4 rounded-md hover:bg-[#006195] transition-colors duration-200 inline-block">
            Browse Files
          </span>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf" 
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
        </label>
        <p className="mt-4 text-neutral-500 text-sm">Maximum file size: 10MB</p>
      </div>
      
      {isAuthenticated && recentDocuments.length > 0 && (
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="font-medium text-lg text-neutral-900 mb-4">Recent Documents</h3>
          <ul className="divide-y divide-gray-200">
            {recentDocuments.map((doc) => (
              <li key={doc.id} className="py-3 flex justify-between items-center hover:bg-neutral-50 rounded px-2 transition-colors duration-200">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-[#0077B5] mr-3" />
                  <span className="text-neutral-900">{doc.originalName}</span>
                </div>
                <span className="text-neutral-500 text-sm flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Template } from '@shared/schema';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplateSelectionProps {
  onSelectTemplate: (template: Template) => void;
  selectedTemplateId?: number;
}

export default function TemplateSelection({ onSelectTemplate, selectedTemplateId }: TemplateSelectionProps) {
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Choose a Template</h3>
        <div className="flex justify-center py-4">
          <div className="animate-pulse flex space-x-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-36">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-medium text-neutral-900 mb-4">Choose a Template</h3>
      
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex space-x-4">
          {templates.map((template) => (
            <div 
              key={template.id}
              className={`template-card flex-shrink-0 w-36 cursor-pointer bg-neutral-50 rounded-md overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${
                selectedTemplateId === template.id ? 'ring-2 ring-[#0077B5]' : ''
              }`}
              onClick={() => handleSelectTemplate(template)}
            >
              <img 
                src={template.imagePath} 
                alt={template.name} 
                className="w-full h-24 object-cover" 
              />
              <div className="p-2">
                <p className="text-neutral-900 text-sm truncate">{template.name}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

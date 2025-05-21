import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

interface OnboardingTooltipProps {
  steps: OnboardingStep[];
  isOpen: boolean;
  onFinish: () => void;
  onDismiss?: () => void;
}

export function OnboardingTooltip({ steps, isOpen, onFinish, onDismiss }: OnboardingTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const getElementPosition = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom + scrollTop,
      right: rect.right + scrollLeft,
    };
  };
  
  const calculatePosition = () => {
    const step = steps[currentStep];
    if (!step) return;
    
    const elementPos = getElementPosition(step.targetId);
    if (!elementPos) return;
    
    const tooltipWidth = 280;
    const tooltipHeight = 150;
    
    // Default position (below and centered)
    let newPosition = {
      top: elementPos.bottom + 10,
      left: elementPos.left + (elementPos.width / 2) - (tooltipWidth / 2),
    };
    
    // Adjust based on specified position
    switch (step.position) {
      case 'top':
        newPosition = {
          top: elementPos.top - tooltipHeight - 10,
          left: elementPos.left + (elementPos.width / 2) - (tooltipWidth / 2),
        };
        break;
      case 'right':
        newPosition = {
          top: elementPos.top + (elementPos.height / 2) - (tooltipHeight / 2),
          left: elementPos.right + 10,
        };
        break;
      case 'bottom':
        // Default position already set
        break;
      case 'left':
        newPosition = {
          top: elementPos.top + (elementPos.height / 2) - (tooltipHeight / 2),
          left: elementPos.left - tooltipWidth - 10,
        };
        break;
    }
    
    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (newPosition.left < 10) newPosition.left = 10;
    if (newPosition.left + tooltipWidth > viewportWidth - 10) {
      newPosition.left = viewportWidth - tooltipWidth - 10;
    }
    
    if (newPosition.top < 10) newPosition.top = 10;
    if (newPosition.top + tooltipHeight > viewportHeight - 10) {
      newPosition.top = viewportHeight - tooltipHeight - 10;
    }
    
    setPosition(newPosition);
  };
  
  useEffect(() => {
    if (!isOpen) return;
    
    calculatePosition();
    
    // Recalculate on window resize
    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    
    // Highlight the target element
    const targetElement = document.getElementById(steps[currentStep]?.targetId);
    if (targetElement) {
      targetElement.classList.add('onboarding-highlight');
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      // Remove highlight
      if (targetElement) {
        targetElement.classList.remove('onboarding-highlight');
      }
    };
  }, [isOpen, currentStep, steps]);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  if (!isOpen || !steps.length) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onDismiss} />
      <div 
        className="fixed z-50 w-[280px] bg-white rounded-lg shadow-lg p-4 border border-gray-200"
        style={{ 
          top: `${position.top}px`, 
          left: `${position.left}px`,
        }}
      >
        <button 
          onClick={onDismiss} 
          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          aria-label="Close tooltip"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#0077B5]">{steps[currentStep]?.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{steps[currentStep]?.content}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  index === currentStep ? "bg-[#0077B5]" : "bg-gray-300"
                )}
              />
            ))}
          </div>
          
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button 
                onClick={handlePrevious}
                className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
              >
                Back
              </button>
            )}
            <button 
              onClick={handleNext}
              className="text-xs px-3 py-1 rounded bg-[#0077B5] text-white hover:bg-[#006195]"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
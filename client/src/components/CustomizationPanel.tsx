import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Template } from '@shared/schema';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import AzureAnalysisButton from './AzureAnalysisButton';

interface CustomizationPanelProps {
  templateId: number;
  onCustomizationChange: (customizations: PDFCustomizations) => void;
  onApplyChanges: () => void;
  initialCustomizations?: Partial<PDFCustomizations>;
}

export interface PDFCustomizations {
  title: string;
  subtitle: string;
  presenter: string;
  date: string;
  colorScheme: string;
  fontFamily: string;
  titleSize: string;
  titleAlignment: 'left' | 'center' | 'right';
  backgroundStyle: string;
  backgroundOpacity: number;
}

const colorOptions = [
  { value: '#0077B5', label: 'LinkedIn Blue' },
  { value: '#9333EA', label: 'Purple' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Red' },
  { value: '#374151', label: 'Dark Gray' },
];

const fontOptions = [
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Raleway', label: 'Raleway' },
];

const backgroundStyles = [
  { value: 'gradient1', label: 'Blue to Purple Gradient', color: 'from-blue-400 to-purple-500' },
  { value: 'solid', label: 'Solid White', color: 'bg-white' },
  { value: 'pattern1', label: 'Geometric Pattern', image: 'https://images.unsplash.com/photo-1580554530778-ca36943938b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=48' },
  { value: 'gradient2', label: 'Green to Blue Gradient', color: 'from-green-400 to-blue-500' },
  { value: 'gradient3', label: 'Yellow to Orange Gradient', color: 'from-yellow-400 to-orange-500' },
  { value: 'pattern2', label: 'Abstract Elements', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=48' },
];

export default function CustomizationPanel({ 
  templateId, 
  onCustomizationChange,
  onApplyChanges,
  initialCustomizations = {}
}: CustomizationPanelProps) {
  const defaultCustomizations: PDFCustomizations = {
    title: "Presentation Title",
    subtitle: "Subtitle or Tagline",
    presenter: "",
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    colorScheme: '#0077B5',
    fontFamily: 'Roboto',
    titleSize: 'Medium',
    titleAlignment: 'center',
    backgroundStyle: 'gradient1',
    backgroundOpacity: 100,
  };

  const [customizations, setCustomizations] = useState<PDFCustomizations>({
    ...defaultCustomizations,
    ...initialCustomizations
  });

  useEffect(() => {
    onCustomizationChange(customizations);
  }, [customizations, onCustomizationChange]);

  const handleInputChange = (field: keyof PDFCustomizations, value: string | number) => {
    setCustomizations(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-6">
      <h2 className="text-xl font-medium text-neutral-900 mb-4">Customize Cover Page</h2>
      
      {/* Azure Analysis Button for LinkedIn optimization */}
      <div className="mb-6">
        <AzureAnalysisButton 
          documentId={templateId} 
          onAnalysisComplete={(suggestions) => setCustomizations(prev => ({...prev, ...suggestions}))} 
        />
        <div className="text-xs text-gray-500 text-center">
          Uses Azure OpenAI to generate LinkedIn-optimized content from your document
        </div>
      </div>
      
      {/* Text editing */}
      <div className="mb-6">
        <h3 className="text-base font-medium text-neutral-900 mb-3">Title & Text</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-neutral-600 mb-1">Title</Label>
            <Input 
              id="title" 
              className="w-full px-3 py-2" 
              placeholder="Enter presentation title" 
              value={customizations.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="subtitle" className="text-sm font-medium text-neutral-600 mb-1">Subtitle</Label>
            <Input 
              id="subtitle" 
              className="w-full px-3 py-2" 
              placeholder="Enter subtitle" 
              value={customizations.subtitle}
              onChange={(e) => handleInputChange('subtitle', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="presenter" className="text-sm font-medium text-neutral-600 mb-1">Presenter</Label>
            <Input 
              id="presenter" 
              className="w-full px-3 py-2" 
              placeholder="Enter your name" 
              value={customizations.presenter}
              onChange={(e) => handleInputChange('presenter', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="date" className="text-sm font-medium text-neutral-600 mb-1">Date</Label>
            <Input 
              id="date" 
              className="w-full px-3 py-2" 
              placeholder="Enter date" 
              value={customizations.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Color & Font customization */}
      <div className="mb-6">
        <h3 className="text-base font-medium text-neutral-900 mb-3">Style</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-neutral-600 mb-2 block">Color Scheme</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(color => (
                <button 
                  key={color.value}
                  className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    customizations.colorScheme === color.value ? 'border-black ring-2 ring-offset-2' : 'border-white'
                  }`}
                  style={{ backgroundColor: color.value }}
                  aria-label={color.label}
                  onClick={() => handleInputChange('colorScheme', color.value)}
                ></button>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="font-family" className="text-sm font-medium text-neutral-600 mb-1">Font</Label>
            <Select 
              value={customizations.fontFamily} 
              onValueChange={(value) => handleInputChange('fontFamily', value)}
            >
              <SelectTrigger id="font-family">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map(font => (
                  <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="title-size" className="text-sm font-medium text-neutral-600 mb-1">Title Size</Label>
            <Select 
              value={customizations.titleSize} 
              onValueChange={(value) => handleInputChange('titleSize', value)}
            >
              <SelectTrigger id="title-size">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Small">Small</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Large">Large</SelectItem>
                <SelectItem value="Extra Large">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-neutral-600 mb-2 block">Title Alignment</Label>
            <ToggleGroup 
              type="single" 
              variant="outline"
              value={customizations.titleAlignment}
              onValueChange={(value) => {
                if (value) handleInputChange('titleAlignment', value as 'left' | 'center' | 'right');
              }}
              className="flex"
            >
              <ToggleGroupItem value="left" aria-label="Align left">
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Align center">
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Align right">
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>
      
      {/* Background options */}
      <div>
        <h3 className="text-base font-medium text-neutral-900 mb-3">Background</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-neutral-600 mb-2 block">Background Style</Label>
            <div className="grid grid-cols-3 gap-2">
              {backgroundStyles.map(bg => (
                <button 
                  key={bg.value}
                  className={`h-12 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 overflow-hidden ${
                    customizations.backgroundStyle === bg.value ? 'ring-2 ring-offset-2 ring-[#0077B5]' : ''
                  } ${bg.color || ''}`}
                  onClick={() => handleInputChange('backgroundStyle', bg.value)}
                  aria-label={bg.label}
                >
                  {bg.image && (
                    <img src={bg.image} alt={bg.label} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="opacity" className="text-sm font-medium text-neutral-600 mb-1">Background Opacity</Label>
            <Slider
              id="opacity"
              min={0}
              max={100}
              step={1}
              value={[customizations.backgroundOpacity]}
              onValueChange={(value) => handleInputChange('backgroundOpacity', value[0])}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <Button 
          onClick={onApplyChanges}
          className="w-full py-2 bg-[#0077B5] hover:bg-[#006195]"
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
}

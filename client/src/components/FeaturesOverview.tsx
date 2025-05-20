import { LayoutTemplate, Pencil, Share2 } from "lucide-react";

export default function FeaturesOverview() {
  return (
    <div className="mt-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-medium text-neutral-900 mb-2">Transform Your Presentations</h2>
        <p className="text-neutral-600 max-w-2xl mx-auto">Professional-looking presentations in just a few clicks</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="bg-[#E8F4F9] w-12 h-12 flex items-center justify-center rounded-full mb-4">
            <LayoutTemplate className="h-6 w-6 text-[#0077B5]" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Professional Templates</h3>
          <p className="text-neutral-600">Choose from a variety of professional templates designed to make your presentations stand out.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="bg-[#E8F4F9] w-12 h-12 flex items-center justify-center rounded-full mb-4">
            <Pencil className="h-6 w-6 text-[#0077B5]" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Easy Customization</h3>
          <p className="text-neutral-600">Personalize your cover page with your own text, colors, and fonts to match your brand.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="bg-[#E8F4F9] w-12 h-12 flex items-center justify-center rounded-full mb-4">
            <Share2 className="h-6 w-6 text-[#0077B5]" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">LinkedIn Integration</h3>
          <p className="text-neutral-600">Connect with LinkedIn to easily share your enhanced presentations with your network.</p>
        </div>
      </div>
    </div>
  );
}

import { Helmet } from 'react-helmet';
import UploadArea from '@/components/UploadArea';
import FeaturesOverview from '@/components/FeaturesOverview';

export default function Home() {
  return (
    <>
      <Helmet>
        <title>PresentPro - Enhance Your PDF Presentations</title>
        <meta name="description" content="Upload your PDF and transform the first page into a professional, customized cover slide using our beautiful templates." />
        <meta property="og:title" content="PresentPro - Enhance Your PDF Presentations" />
        <meta property="og:description" content="Transform your presentations with professional cover pages in just a few clicks." />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium text-neutral-900 mb-2">Enhance Your PDF Presentations</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">Upload your PDF and transform the first page into a professional, customized cover slide using our beautiful templates.</p>
        </div>
        
        <UploadArea />
        <FeaturesOverview />
      </main>
    </>
  );
}

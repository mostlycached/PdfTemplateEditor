import { FileText } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white mt-12 py-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-[#0077B5] mr-2" />
              <span className="text-lg font-medium text-neutral-900">PresentPro</span>
            </div>
            <p className="text-neutral-600 mt-1">Create professional presentations in minutes</p>
          </div>
          
          <div className="flex space-x-6">
            <Link href="#" className="text-neutral-600 hover:text-[#0077B5] transition-colors duration-200">
              Help Center
            </Link>
            <Link href="#" className="text-neutral-600 hover:text-[#0077B5] transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="#" className="text-neutral-600 hover:text-[#0077B5] transition-colors duration-200">
              Terms of Service
            </Link>
            <Link href="#" className="text-neutral-600 hover:text-[#0077B5] transition-colors duration-200">
              Contact
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-neutral-500">
          <p>&copy; {new Date().getFullYear()} PresentPro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

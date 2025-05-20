import { useAuth } from "./AuthContext";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SiLinkedin } from "react-icons/si";

export default function Header() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-[#0077B5]" />
            <h1 className="text-xl font-medium text-neutral-900">PresentPro</h1>
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8 bg-[#0077B5] text-white">
                  <AvatarImage src={user?.profilePicture} alt={user?.fullName || user?.username} />
                  <AvatarFallback>
                    {user?.fullName 
                      ? `${user.fullName.split(' ')[0][0]}${user.fullName.split(' ')[1]?.[0] || ''}`
                      : user?.username?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-neutral-900">{user?.fullName || user?.username}</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-neutral-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>My Account</DropdownMenuItem>
                  <DropdownMenuItem>My Documents</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button 
              onClick={login}
              className="bg-[#0077B5] hover:bg-[#006195] text-white flex items-center px-4 py-2 rounded-md font-medium transition-colors duration-200"
            >
              <SiLinkedin className="mr-2 h-5 w-5" />
              Sign in with LinkedIn
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

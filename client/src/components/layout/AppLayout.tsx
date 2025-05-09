import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import { useAuth } from '@/lib/auth.tsx';
import { ChevronDown, Menu, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    checkMobile();

    // Add event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="flex justify-between items-center px-4 py-2">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-neutral-100 focus:outline-none"
            >
              <Menu className="h-5 w-5 text-neutral-700" />
            </Button>
            <h1 className="text-xl font-medium text-neutral-900">Sistema de Transporte Público</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <Badge 
                variant={user?.role === 'admin' ? 'default' : 'info'}
                className="px-2 py-1 text-xs"
              >
                {user?.role === 'admin' ? 'Administrador' : 'Chofer'}
              </Badge>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center">
                    <User className="h-4 w-4 text-neutral-600" />
                  </div>
                  <span className="hidden md:inline text-sm text-neutral-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi perfil</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="mr-2 h-4 w-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                    />
                  </svg>
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMobile={isMobile} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-100 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

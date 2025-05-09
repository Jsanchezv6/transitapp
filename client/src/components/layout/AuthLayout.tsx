import { useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/lib/auth.tsx';
import { Loader2 } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthLayout({ children, requireAuth = true }: AuthLayoutProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [isLoginPage] = useRoute('/login');

  useEffect(() => {
    if (!isLoading) {
      // If authentication is required but user isn't authenticated, redirect to login
      if (requireAuth && !isAuthenticated && !isLoginPage) {
        setLocation('/login');
      }
      
      // If user is authenticated and on login page, redirect to dashboard
      if (isAuthenticated && isLoginPage) {
        setLocation('/');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, isLoginPage, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="mt-4 text-lg font-medium">Loading...</h2>
        </div>
      </div>
    );
  }

  // If auth is required and user isn't authenticated, don't render children
  if (requireAuth && !isAuthenticated && !isLoginPage) {
    return null;
  }

  // If user is authenticated and on login page, don't render children
  if (isAuthenticated && isLoginPage) {
    return null;
  }

  return <>{children}</>;
}

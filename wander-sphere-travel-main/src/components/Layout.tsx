import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "./Header";
import BottomNav from "./BottomNav";
import LoadingScreen from "./LoadingScreen";
import OfflineBanner from "./OfflineBanner";


interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  
  // Show loading screen during auth initialization
  if (isLoading) {
    return (
      <LoadingScreen 
          onSkip={() => window.location.href = '/login'}
          onBypassAuth={() => {
            localStorage.setItem('dev-bypass-auth', 'true');
            localStorage.setItem('dev-user', JSON.stringify({
              id: 'dev-user-123',
              email: 'dev@wandersphere.com',
              name: 'Development User'
            }));
            window.location.reload();
          }}
          onClearData={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }}
        />
    );
  }
  
  // Redirect to login if not authenticated and not on a public route
  if (!isAuthenticated && !isPublicRoute) {
    window.location.href = '/login';
    return null;
  }
  
  // For public routes, render without navigation
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-background">
        <main>
          {children}
        </main>
      </div>
    );
  }
  
  // For authenticated routes, render with full navigation
  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      <Header />
      <main className="pb-20 pt-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
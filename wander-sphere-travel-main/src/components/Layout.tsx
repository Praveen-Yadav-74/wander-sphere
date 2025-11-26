import { ReactNode, useState } from "react";
import { useLocation, Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "./Header";
import BottomNav from "./BottomNav";
import LoadingScreen from "./LoadingScreen";
import OfflineBanner from "./OfflineBanner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";


interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [navCollapsed, setNavCollapsed] = useState(false);
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login', 
    '/register', 
    '/forgot-password', 
    '/reset-password',
    '/', // Home page is public
    '/find-trips', // Trips section is public
    '/trips', // Trip details are public
    '/budget', // Budget section is public (demo mode)
    '/clubs', // Clubs are public
    '/clubs/', // Club details are public
    '/booking' // Booking section is public
  ];
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/map', // Maps section is protected
    '/journeys', // Journeys section is protected
    '/profile',
    '/settings',
    '/notifications'
  ];
  
  // Check if current path starts with any protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );
  
  // Check if current path starts with any public route
  const isPublicRoute = publicRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );
  
  // Show loading screen during auth initialization
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // For protected routes when user is not authenticated, show auth prompt instead of redirecting
  if (!isAuthenticated && isProtectedRoute) {
    // Store the current URL to redirect back after login
    localStorage.setItem('redirectAfterAuth', window.location.pathname);
    
    return (
      <>
        <OfflineBanner />
        <Header />
        
        {/* Auth prompt for protected pages */}
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
            <p className="mb-6">You need to sign in to explore this section of WanderSphere.</p>
            <div className="flex gap-4 justify-center">
              <Link to="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-md">Sign In</Link>
              <Link to="/register" className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md">Register</Link>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Check if we should hide navigation (login/register pages)
  const hideNavigation = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  
  // For auth pages, render without header and navigation
  if (hideNavigation) {
    return (
      <>
        <OfflineBanner />
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </>
    );
  }
  
  // For all other routes, render with navigation
  return (
    <>
      <OfflineBanner />
      <Header />
      
      {/* Collapsible side navigation - only visible on desktop and not on auth pages */}
      {!hideNavigation && (
        <nav className={`fixed left-0 top-16 bottom-0 hidden md:flex flex-col ${navCollapsed ? 'w-16' : 'w-64'} border-r border-border bg-background z-40 transition-all duration-300`}>
        <div className="p-4 space-y-2 flex-1">
          <NavLink 
            to="/" 
            className={({ isActive }) => cn(
              "flex items-center p-2 rounded-lg transition-all duration-200",
              isActive 
                ? "text-primary bg-primary/15 shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            end
          >
            <span className="flex justify-center items-center w-6 h-6">🏠</span>
            {!navCollapsed && <span className="ml-2">Home</span>}
          </NavLink>
          <NavLink 
            to="/find-trips" 
            className={({ isActive }) => cn(
              "flex items-center p-2 rounded-lg transition-all duration-200",
              isActive 
                ? "text-primary bg-primary/15 shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <span className="flex justify-center items-center w-6 h-6">🧳</span>
            {!navCollapsed && <span className="ml-2">Trips</span>}
          </NavLink>
          <NavLink 
            to="/map" 
            className={({ isActive }) => cn(
              "flex items-center p-2 rounded-lg transition-all duration-200",
              isActive 
                ? "text-primary bg-primary/15 shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <span className="flex justify-center items-center w-6 h-6">🗺️</span>
            {!navCollapsed && <span className="ml-2">Maps</span>}
          </NavLink>
          <NavLink 
            to="/budget" 
            className={({ isActive }) => cn(
              "flex items-center p-2 rounded-lg transition-all duration-200",
              isActive 
                ? "text-primary bg-primary/15 shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <span className="flex justify-center items-center w-6 h-6">💰</span>
            {!navCollapsed && <span className="ml-2">Budget</span>}
          </NavLink>
          <NavLink 
            to="/booking" 
            className={({ isActive }) => cn(
              "flex items-center p-2 rounded-lg transition-all duration-200",
              isActive 
                ? "text-primary bg-primary/15 shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <span className="flex justify-center items-center w-6 h-6">🏨</span>
            {!navCollapsed && <span className="ml-2">Bookings</span>}
          </NavLink>
        </div>
        <button 
          onClick={() => setNavCollapsed(!navCollapsed)} 
          className="p-2 m-2 rounded-full bg-accent self-end hover:bg-accent/80 transition-colors"
        >
          {navCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        </nav>
      )}
      
      {/* Main content - with padding for side nav on desktop */}
      <main className={`min-h-screen bg-background pt-16 pb-20 md:pb-0 ${!hideNavigation ? (navCollapsed ? 'md:ml-16' : 'md:ml-64') : ''} transition-all duration-300`}>
        {children}
      </main>
      
      {/* Bottom nav - only visible on mobile */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </>
  );
};

export default Layout;
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Clubs from "./pages/Clubs";
import FindTrips from "./pages/FindTrips";
import TravelMap from "./pages/TravelMap";
import Budget from "./pages/Budget";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Search from "./pages/Search";
import BookingSpace from "./pages/BookingSpace";
import ClubDetail from "./pages/ClubDetail";
import TripDetail from "./pages/TripDetail";
import JourneyDetail from "./pages/JourneyDetail";
import BudgetDetail from "./pages/BudgetDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component - Redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Authentication routes - Public */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    
    {/* All other routes require authentication */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      }
    />
    <Route
      path="/clubs"
      element={
        <ProtectedRoute>
          <Clubs />
        </ProtectedRoute>
      }
    />
    <Route
      path="/clubs/:id"
      element={
        <ProtectedRoute>
          <ClubDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/find-trips"
      element={
        <ProtectedRoute>
          <FindTrips />
        </ProtectedRoute>
      }
    />
    <Route
      path="/trips/:id"
      element={
        <ProtectedRoute>
          <TripDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/budget"
      element={
        <ProtectedRoute>
          <Budget />
        </ProtectedRoute>
      }
    />
    <Route
      path="/budget/:id"
      element={
        <ProtectedRoute>
          <BudgetDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/map"
      element={
        <ProtectedRoute>
          <TravelMap />
        </ProtectedRoute>
      }
    />
    <Route
      path="/journeys/:id"
      element={
        <ProtectedRoute>
          <JourneyDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      }
    />
    <Route
      path="/search"
      element={
        <ProtectedRoute>
          <Search />
        </ProtectedRoute>
      }
    />
    <Route
      path="/booking"
      element={
        <ProtectedRoute>
          <BookingSpace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/notifications"
      element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      }
    />
    
    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <AppRoutes />
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
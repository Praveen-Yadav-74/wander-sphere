import React from "react";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataCacheProvider } from "./contexts/DataCacheContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Clubs from "./pages/Clubs";
import FindTrips from "./pages/FindTrips";
import MyTrips from "./pages/MyTrips";
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
import BusBooking from "./pages/BusBooking";
import BusSeatSelection from "./pages/BusSeatSelection";
import BookingPayment from "./components/booking/BookingPayment";
import FlightBooking from "./pages/FlightBooking";
import HotelBooking from "./pages/HotelBooking";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // CRITICAL: Prevent tab switch reloads (like Instagram/Facebook)
      refetchOnWindowFocus: false, // Never refetch when tab regains focus
      refetchOnMount: false, // Don't refetch on component mount if data exists
      refetchOnReconnect: false, // Don't refetch when internet reconnects
      
      // Cache configuration for social media experience
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes (no refetch during this time)
      gcTime: 30 * 60 * 1000, // Keep data in memory for 30 minutes even if unused
      
      // Network optimization
      retry: 1, // Only retry failed requests once
      retryDelay: 1000, // Wait 1 second before retry
      
      // Enable structural sharing to preserve object references
      structuralSharing: true, // Prevents unnecessary re-renders
    },
  },
});

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

import PrivacyPolicy from "./pages/PrivacyPolicy";

const AppRoutes = () => (
  <Routes>
    {/* Authentication routes - Public */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    
    {/* All other routes requires authentication */}
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
      path="/my-trips"
      element={
        <ProtectedRoute>
          <MyTrips />
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
      path="/booking/bus"
      element={
        <ProtectedRoute>
          <BusBooking />
        </ProtectedRoute>
      }
    />
    <Route
      path="/booking/bus/seats"
      element={
        <ProtectedRoute>
          <BusSeatSelection />
        </ProtectedRoute>
      }
    />
    <Route
      path="/booking/checkout"
      element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50 pt-16">
            <BookingPayment />
          </div>
        </ProtectedRoute>
      }
    />
    <Route
      path="/booking/flight"
      element={
        <ProtectedRoute>
          <FlightBooking />
        </ProtectedRoute>
      }
    />
    <Route
      path="/booking/hotel"
      element={
        <ProtectedRoute>
          <HotelBooking />
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
        <DataCacheProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Layout>
                <AppRoutes />
              </Layout>
            </BrowserRouter>
          </TooltipProvider>
        </DataCacheProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
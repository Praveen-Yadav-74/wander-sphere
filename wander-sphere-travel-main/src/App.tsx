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
import NotificationsSocial from "./pages/NotificationsSocial";
import NotFound from "./pages/NotFound";
import HotelBooking from "./pages/HotelBooking";
import PaymentSettings from "./pages/admin/PaymentSettings";
import BusBooking from "./pages/BusBooking";
import BusSeatSelection from "./pages/BusSeatSelection";
import BookingPayment from "./components/booking/BookingPayment";
import FlightBooking from "./pages/FlightBooking";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataPolicy from "./pages/DataPolicy";
import AccountDeletion from "./pages/AccountDeletion";
import WalletPage from "./pages/WalletPage";
import ManageClubs from "./pages/ManageClubs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
      structuralSharing: true,
    },
  },
});

// Protected Route Component
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
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/data-policy" element={<DataPolicy />} />
    <Route path="/account-deletion" element={<AccountDeletion />} />
    
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
    <Route
      path="/wallet"
      element={
        <ProtectedRoute>
          <WalletPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/bookings"
      element={
        <ProtectedRoute>
          <MyTrips />
        </ProtectedRoute>
      }
    />
    <Route
      path="/saved"
      element={
        <ProtectedRoute>
          <MyTrips />
        </ProtectedRoute>
      }
    />
    <Route
      path="/support"
      element={
        <ProtectedRoute>
          <div className="min-h-screen pt-20 px-4 text-center">
             <h1 className="text-2xl font-bold">Help & Support</h1>
             <p className="text-muted-foreground mt-2">Coming Soon.</p>
          </div>
        </ProtectedRoute>
      }
    />
    <Route
      path="/manage-clubs"
      element={
        <ProtectedRoute>
          <ManageClubs />
        </ProtectedRoute>
      }
    />
    
    {/* Admin Routes */}
    <Route
      path="/admin/payments"
      element={
        <ProtectedRoute>
          <PaymentSettings />
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
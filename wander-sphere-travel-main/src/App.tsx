import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
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

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/" element={<Home />} />
                <Route path="/clubs" element={<Clubs />} />
                <Route path="/clubs/:id" element={<ClubDetail />} />
                <Route path="/find-trips" element={<FindTrips />} />
                <Route path="/trips/:id" element={<TripDetail />} />
                <Route path="/map" element={<TravelMap />} />
                <Route path="/journeys/:id" element={<JourneyDetail />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/budget/:id" element={<BudgetDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/search" element={<Search />} />
                <Route path="/booking" element={<BookingSpace />} />
                <Route path="/notifications" element={<Notifications />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import BookingSearch from "@/components/booking/BookingSearch";
import BookingWalletWidget from "@/components/wallet/BookingWalletWidget";
import BookingAnalytics from "@/components/booking/BookingAnalytics";
import BookingHistory from "@/components/booking/BookingHistory";

const BookingSpace = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 py-8 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName || 'Traveler'}
                </h1>
                <p className="text-gray-500 mt-1">Let's book your next adventure.</p>
            </div>
            {/* Wallet Widget - Kept as it's useful context */}
            <div className="flex-shrink-0">
                 <BookingWalletWidget />
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        {/* Search Section */}
        <div className="relative z-10 mb-8">
            <BookingSearch />
        </div>

        {/* Analytics Dashboard */}
        <BookingAnalytics />

        {/* Booking History & List */}
        <BookingHistory />
      </div>
    </div>
  );
};

export default BookingSpace;

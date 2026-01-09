import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import BookingSearch from "@/components/booking/BookingSearch";
import BookingWalletWidget from "@/components/wallet/BookingWalletWidget";

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
      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="relative z-10">
            <BookingSearch />
        </div>

        {/* Informational / Promo Section (Placeholder for "Search Results" or "Offers") */}
        <div className="max-w-5xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-2xl">🛡️</div>
                <h3 className="font-semibold text-gray-900">Secure Payments</h3>
                <p className="text-sm text-gray-500 mt-2">Your transactions are protected with bank-level security.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-2xl">⚡</div>
                <h3 className="font-semibold text-gray-900">Instant Booking</h3>
                <p className="text-sm text-gray-500 mt-2">Get confirmed tickets in seconds directly to your email.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-2xl">🏷️</div>
                <h3 className="font-semibold text-gray-900">Best Prices</h3>
                <p className="text-sm text-gray-500 mt-2">We guarantee the best prices on flights and hotels.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSpace;

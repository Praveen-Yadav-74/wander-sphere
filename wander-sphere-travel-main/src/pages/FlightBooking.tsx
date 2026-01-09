import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BookingSearch from '@/components/booking/BookingSearch';
import SearchResults from '@/components/booking/SearchResults';

const FlightBooking = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
        {/* Simple Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/booking')}>
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Button>
                    <h1 className="font-bold text-xl text-gray-900">Flight Search</h1>
                 </div>
                 <div className="hidden md:block">
                     {/* User profile or mini-wallet could go here */}
                 </div>
            </div>
        </div>

        {/* Search Container (Collapsed version could be nice, but full is fine for now) */}
        <div className="bg-white border-b border-gray-200 pb-8 pt-4 mb-4">
            <BookingSearch />
        </div>

        {/* Results */}
        <SearchResults type="flight" />
    </div>
  );
};

export default FlightBooking;

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Hotel, Bus, Car, Calendar, MapPin, Clock, ArrowRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type BookingCategory = 'All' | 'Flight' | 'Hotel' | 'Bus' | 'Cab' | 'Train';
type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  type: BookingCategory;
  destination: string;
  date: string;
  amount: number;
  status: BookingStatus;
  image: string; // Placeholder for destination image
  reference: string;
}

// Mock Data
const MOCK_BOOKINGS: Booking[] = [
  {
    id: "BK-7829",
    type: "Flight",
    destination: "Bali, Indonesia",
    date: "Aug 15, 2024",
    amount: 1450,
    status: 'upcoming',
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=400&auto=format&fit=crop",
    reference: "GA-892"
  },
  {
    id: "BK-9921",
    type: "Hotel",
    destination: "Grand Hyatt, Bali",
    date: "Aug 15 - Aug 20, 2024",
    amount: 850,
    status: 'upcoming',
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop",
    reference: "RES-5542"
  },
  {
    id: "BK-4421",
    type: "Flight",
    destination: "Tokyo, Japan",
    date: "Jan 10, 2024",
    amount: 1200,
    status: 'completed',
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=400&auto=format&fit=crop",
    reference: "JL-401"
  },
  {
    id: "BK-3321",
    type: "Bus",
    destination: "Kyoto Transfer",
    date: "Jan 12, 2024",
    amount: 45,
    status: 'completed',
    image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=400&auto=format&fit=crop",
    reference: "BUS-22"
  },
  {
    id: "BK-1102",
    type: "Hotel",
    destination: "Marina Bay Sands",
    date: "Nov 05, 2023",
    amount: 2100,
    status: 'cancelled',
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=400&auto=format&fit=crop",
    reference: "MBS-999"
  }
];

const BookingHistory = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [activeCategory, setActiveCategory] = useState<BookingCategory>('All');

  const categories: BookingCategory[] = ['All', 'Flight', 'Hotel', 'Bus', 'Cab', 'Train'];

  const filteredBookings = MOCK_BOOKINGS.filter(booking => {
    // Filter by tab (status)
    const matchesTab = activeTab === 'upcoming' 
      ? booking.status === 'upcoming'
      : (booking.status === 'completed' || booking.status === 'cancelled');
    
    // Filter by category
    const matchesCategory = activeCategory === 'All' || booking.type === activeCategory;

    return matchesTab && matchesCategory;
  });

  const getIcon = (type: BookingCategory) => {
    switch(type) {
      case 'Flight': return <Plane className="w-4 h-4" />;
      case 'Hotel': return <Hotel className="w-4 h-4" />;
      case 'Bus': return <Bus className="w-4 h-4" />;
      case 'Cab': return <Car className="w-4 h-4" />;
      case 'Train': return <div className="w-4 h-4">🚆</div>;
      default: return <Plane className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch(status) {
      case 'upcoming': return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case 'completed': return "bg-green-100 text-green-700 hover:bg-green-100";
      case 'cancelled': return "bg-red-100 text-red-700 hover:bg-red-100";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Booking History</h2>
          <p className="text-sm text-gray-500">Track and manage your trips</p>
        </div>
        
        {/* Toggle Tabs */}
        <div className="bg-gray-100 p-1 rounded-xl inline-flex w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'upcoming' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Upcoming
          </button>
          <button
             onClick={() => setActiveTab('history')}
             className={cn(
               "px-4 py-2 rounded-lg text-sm font-medium transition-all",
               activeTab === 'history' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
             )}
          >
            Past Trips
          </button>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide mb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
              activeCategory === cat 
                ? "bg-gray-900 text-white border-gray-900" 
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => (
            <Card key={booking.id} className="overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="flex flex-col sm:flex-row">
                {/* Image Section */}
                <div className="sm:w-32 h-32 sm:h-auto relative bg-gray-200">
                  <img src={booking.image} alt={booking.destination} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm">
                    {getIcon(booking.type)}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{booking.destination}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        {booking.date}
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn("capitalize", getStatusColor(booking.status))}>
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-medium">BOOKING ID</span>
                      <span className="text-sm font-mono text-gray-700">{booking.id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                         <span className="font-bold text-gray-900">${booking.amount}</span>
                         <Button size="sm" variant="outline" className="h-8 gap-1 group-hover:bg-primary group-hover:text-white transition-colors">
                            Details <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                         </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <div className="bg-white p-3 rounded-full w-fit mx-auto shadow-sm mb-3">
               <Clock className="w-6 h-6 text-gray-400" />
             </div>
             <h3 className="text-gray-900 font-medium">No bookings found</h3>
             <p className="text-gray-500 text-sm mt-1">
               {activeTab === 'upcoming' 
                 ? "You don't have any upcoming trips scheduled." 
                 : "No past booking history available for this category."}
             </p>
             <Button variant="link" className="mt-2 text-primary">Start exploring</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;

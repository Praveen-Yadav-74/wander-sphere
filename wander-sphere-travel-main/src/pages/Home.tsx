import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plane, Users, Map as MapIcon, Wallet, Bell, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/config/supabase";
import { useApi } from "@/hooks/useApi";
import { endpoints } from "@/config/api";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Traveler");
  
  // Fetch featured trips from backend with caching (1 hour TTL)
  const { data: featuredTripsData, loading } = useApi<any>(endpoints.trips.featured, {
    cache: { ttl: 60 * 60 * 1000, key: 'featured_trips' }
  });
  const featuredTrips = featuredTripsData?.data?.trips || [];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0]);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}


      <main className="px-4 pt-6 space-y-8">
        {/* Section A: Hero Search */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">Where to next?</h1>
            <p className="text-gray-500">Discover your next adventure, {userName}.</p>
          </div>
          
          <div 
            className="relative group cursor-pointer"
            onClick={() => navigate('/find-trips')}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative bg-white border border-gray-100 shadow-lg rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all">
              <Search className="w-6 h-6 text-primary" />
              <input 
                type="text" 
                placeholder="Search destinations..." 
                className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400 font-medium"
                readOnly
              />
            </div>
          </div>
        </section>

        {/* Section B: Quick Actions Grid */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => navigate('/find-trips')}
              className="bg-blue-50 p-4 rounded-2xl flex flex-col gap-3 cursor-pointer active:scale-95 transition-all hover:bg-blue-100 border border-blue-100"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-800">Find Trips</span>
            </div>

            <div 
              onClick={() => navigate('/clubs')}
              className="bg-purple-50 p-4 rounded-2xl flex flex-col gap-3 cursor-pointer active:scale-95 transition-all hover:bg-purple-100 border border-purple-100"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md shadow-purple-200">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-800">Travel Clubs</span>
            </div>

            <div 
              onClick={() => navigate('/map')}
              className="bg-emerald-50 p-4 rounded-2xl flex flex-col gap-3 cursor-pointer active:scale-95 transition-all hover:bg-emerald-100 border border-emerald-100"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
                <MapIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-800">Explore Map</span>
            </div>

            <div 
              onClick={() => navigate('/budget')}
              className="bg-orange-50 p-4 rounded-2xl flex flex-col gap-3 cursor-pointer active:scale-95 transition-all hover:bg-orange-100 border border-orange-100"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-800">Budget Tool</span>
            </div>
          </div>
        </section>

        {/* Section C: Upcoming Trip (Static for now, can be dynamic later) */}
        {/* Placeholder for logic: if (hasActiveBooking) { ... } */}
        {/* Assuming false for generic state or maybe show a promo if none */}
        <section className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">Your Next Adventure</p>
                        <h3 className="text-xl font-bold">Planned a trip yet?</h3>
                    </div>
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                </div>
                <Button 
                    onClick={() => navigate('/find-trips')}
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 border-none font-semibold"
                >
                    Start Planning
                </Button>
             </div>
        </section>

        {/* Section D: Trending Destinations */}
        <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-bold text-gray-900">Trending Now</h2>
                <span className="text-primary text-sm font-medium cursor-pointer">See all</span>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar -mx-4 px-4">
                {loading ? (
                   Array(3).fill(0).map((_, i) => (
                     <Skeleton key={i} className="min-w-[260px] h-[320px] rounded-3xl flex-shrink-0" />
                   ))
                ) : featuredTrips.length > 0 ? (
                  featuredTrips.map((trip: any) => (
                    <div 
                        key={trip.id} 
                        onClick={() => navigate(`/trips/${trip.id}`)}
                        className="min-w-[260px] h-[320px] rounded-3xl relative overflow-hidden flex-shrink-0 snap-center group cursor-pointer"
                    >
                        <img 
                            src={trip.images?.[0] || trip.image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800"} 
                            alt={trip.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-2 inline-block border border-white/30">
                                {trip.dates ? `${Math.ceil((new Date(trip.dates.endDate).getTime() - new Date(trip.dates.startDate).getTime()) / (1000 * 60 * 60 * 24))} Days` : trip.days || "N/A"}
                            </span>
                            <h3 className="text-xl font-bold mb-1 line-clamp-2">{trip.title}</h3>
                            <p className="text-gray-300 font-medium">From {trip.budget?.currency || "$"} {trip.budget?.total || trip.price}</p>
                        </div>
                    </div>
                  ))
                ) : (
                    <div className="w-full text-center text-gray-500 py-10">No featured trips found.</div>
                )}
            </div>
        </section>
      </main>
      
      {/* Spacer for bottom nav */}
      <div className="h-4"></div>
    </div>
  );
};

export default Home;

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, TrendingUp, Calendar, MapPin, Wallet } from "lucide-react";

// Mock data interfaces
interface AnalyticsData {
  totalSpend: number;
  totalTrips: number;
  upcomingTrips: number;
  mostVisitedCategory: string;
}

const BookingAnalytics = () => {
  // Mock data - replace with real API data later
  const data: AnalyticsData = {
    totalSpend: 12450,
    totalTrips: 8,
    upcomingTrips: 2,
    mostVisitedCategory: "Beach Destinations"
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Total Spend */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col justify-between h-[110px]">
          <div className="flex justify-between items-start">
            <div className="bg-blue-100 p-2 rounded-full">
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-green-600 flex items-center bg-green-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12%
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Spend</p>
            <h3 className="text-xl font-bold text-gray-900">${data.totalSpend.toLocaleString()}</h3>
          </div>
        </CardContent>
      </Card>

      {/* Completed Trips */}
      <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col justify-between h-[110px]">
          <div className=" bg-purple-100 p-2 rounded-full w-fit">
            <Plane className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Completed Trips</p>
            <h3 className="text-xl font-bold text-gray-900">{data.totalTrips}</h3>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col justify-between h-[110px]">
          <div className="bg-orange-100 p-2 rounded-full w-fit">
            <Calendar className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Upcoming</p>
            <h3 className="text-xl font-bold text-gray-900">{data.upcomingTrips}</h3>
          </div>
        </CardContent>
      </Card>

      {/* Travel Persona */}
      <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col justify-between h-[110px]">
          <div className="bg-emerald-100 p-2 rounded-full w-fit">
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Top Vibe</p>
            <h3 className="text-sm font-bold text-gray-900 truncate" title={data.mostVisitedCategory}>{data.mostVisitedCategory}</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingAnalytics;

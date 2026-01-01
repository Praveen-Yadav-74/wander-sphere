import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Wifi, Coffee, Snowflake, Tv } from "lucide-react";
import { BusSearchResult } from "@/services/etravService";

interface BusCardProps {
  bus: BusSearchResult;
  onSelect: (bus: BusSearchResult) => void;
}

const BusCard: React.FC<BusCardProps> = ({ bus, onSelect }) => {
  const formatTime = (time: string) => {
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
    }
  };

  const getBusTypeIcon = (busType: string) => {
    if (busType.toLowerCase().includes('sleeper')) {
      return '🛏️';
    }
    return '💺';
  };

  const amenities = bus.amenities || [];

  return (
    <Card className="hover:shadow-lg transition-shadow border-2">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Bus Info */}
          <div className="flex-1 space-y-4">
            {/* Operator & Type */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{bus.operatorName || 'Bus Operator'}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <span>{getBusTypeIcon(bus.busType)}</span>
                  <span>{bus.busType || 'Standard'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">₹{bus.price?.toLocaleString('en-IN') || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">per seat</p>
              </div>
            </div>

            {/* Timing */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-semibold">{formatTime(bus.departureTime)}</p>
                  <p className="text-xs text-muted-foreground">Departure</p>
                </div>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-muted"></div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-semibold">{formatTime(bus.arrivalTime)}</p>
                  <p className="text-xs text-muted-foreground">Arrival</p>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Duration: {bus.duration || 'N/A'}</span>
            </div>

            {/* Available Seats */}
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">
                {bus.availableSeats || 0} seats available
              </span>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="text-xs bg-muted px-2 py-1 rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: Select Button */}
          <div className="flex items-center justify-end md:justify-start">
            <Button
              onClick={() => onSelect(bus)}
              className="bg-primary hover:bg-primary/90 min-w-[120px]"
            >
              Select Bus
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusCard;


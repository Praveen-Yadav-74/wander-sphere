import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, Armchair, Loader2, Users, X } from "lucide-react";
import { SeatLayout, SeatInfo } from "@/services/etravService";
import { toast } from "@/components/ui/use-toast";

interface BusSeatLayoutProps {
  seatLayout: SeatLayout;
  onSeatSelect: (seatNumbers: string[]) => void;
  selectedSeats: string[];
  maxSeats?: number;
}

const BusSeatLayout: React.FC<BusSeatLayoutProps> = ({
  seatLayout,
  onSeatSelect,
  selectedSeats,
  maxSeats = 6
}) => {
  const [localSelectedSeats, setLocalSelectedSeats] = useState<string[]>(selectedSeats);

  useEffect(() => {
    setLocalSelectedSeats(selectedSeats);
  }, [selectedSeats]);

  const handleSeatClick = (seatNumber: string, seatInfo: SeatInfo) => {
    if (!seatInfo.isAvailable || seatInfo.isBooked) {
      toast({
        title: "Seat Unavailable",
        description: "This seat is already booked or not available",
        variant: "destructive"
      });
      return;
    }

    const isSelected = localSelectedSeats.includes(seatNumber);
    
    if (isSelected) {
      // Deselect
      setLocalSelectedSeats(localSelectedSeats.filter(s => s !== seatNumber));
    } else {
      // Select (check max limit)
      if (localSelectedSeats.length >= maxSeats) {
        toast({
          title: "Maximum Seats Reached",
          description: `You can select up to ${maxSeats} seats`,
          variant: "destructive"
        });
        return;
      }
      setLocalSelectedSeats([...localSelectedSeats, seatNumber]);
    }
  };

  const handleConfirmSelection = () => {
    if (localSelectedSeats.length === 0) {
      toast({
        title: "No Seats Selected",
        description: "Please select at least one seat",
        variant: "destructive"
      });
      return;
    }
    onSeatSelect(localSelectedSeats);
  };

  const getSeatColor = (seatInfo: SeatInfo, seatNumber: string) => {
    if (seatInfo.isBooked || !seatInfo.isAvailable) {
      return "bg-red-500 text-white cursor-not-allowed";
    }
    if (seatInfo.isLadiesSeat) {
      return localSelectedSeats.includes(seatNumber)
        ? "bg-pink-600 text-white"
        : "bg-pink-200 text-pink-800 hover:bg-pink-300";
    }
    if (localSelectedSeats.includes(seatNumber)) {
      return "bg-green-600 text-white";
    }
    return "bg-gray-200 text-gray-800 hover:bg-gray-300";
  };

  const getSeatIcon = (seatInfo: SeatInfo) => {
    if (seatInfo.seatType === 'Sleeper') {
      return <Bed className="w-4 h-4" />;
    }
    return <Armchair className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Your Seats
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {localSelectedSeats.length} Selected
            </Badge>
            <Button
              onClick={handleConfirmSelection}
              disabled={localSelectedSeats.length === 0}
              size="sm"
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
              <Armchair className="w-4 h-4" />
            </div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white">
              <Armchair className="w-4 h-4" />
            </div>
            <span className="text-sm">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-200 rounded flex items-center justify-center">
              <Armchair className="w-4 h-4" />
            </div>
            <span className="text-sm">Ladies Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white">
              <X className="w-4 h-4" />
            </div>
            <span className="text-sm">Booked</span>
          </div>
        </div>

        {/* Seat Map */}
        <div className="space-y-4">
          {seatLayout.seatMap.map((row, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-2">
              {/* Row Label */}
              <div className="w-12 text-center text-sm font-medium">
                Row {rowIndex + 1}
              </div>
              
              {/* Seats */}
              <div className="flex-1 flex gap-2">
                {row.map((seatInfo, colIndex) => {
                  const seatNumber = seatInfo.seatNumber || `${rowIndex + 1}-${colIndex + 1}`;
                  const isSelected = localSelectedSeats.includes(seatNumber);
                  
                  return (
                    <button
                      key={colIndex}
                      onClick={() => handleSeatClick(seatNumber, seatInfo)}
                      disabled={seatInfo.isBooked || !seatInfo.isAvailable}
                      className={`
                        w-12 h-12 rounded-lg flex flex-col items-center justify-center
                        transition-all duration-200
                        ${getSeatColor(seatInfo, seatNumber)}
                        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                      `}
                      title={`${seatNumber} - ${seatInfo.seatType}${seatInfo.isLadiesSeat ? ' (Ladies)' : ''}`}
                    >
                      {getSeatIcon(seatInfo)}
                      <span className="text-xs font-medium mt-0.5">{seatNumber}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Seats Summary */}
        {localSelectedSeats.length > 0 && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <p className="font-semibold mb-2">Selected Seats:</p>
            <div className="flex flex-wrap gap-2">
              {localSelectedSeats.map((seat) => (
                <Badge key={seat} variant="secondary" className="bg-primary text-primary-foreground">
                  {seat}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusSeatLayout;


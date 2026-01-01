import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Search, ArrowRightLeft } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BusSearchProps {
  onSearch: (params: {
    from: string;
    to: string;
    date: string;
    adults: number;
  }) => void;
  isLoading?: boolean;
}

const BusSearch: React.FC<BusSearchProps> = ({ onSearch, isLoading = false }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(1);

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!from || !to || !date) {
      return;
    }

    onSearch({
      from,
      to,
      date,
      adults
    });
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full shadow-lg border-2">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* From */}
            <div className="space-y-2">
              <Label htmlFor="from" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                From
              </Label>
              <Input
                id="from"
                type="text"
                placeholder="Enter origin city"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
                className="h-12"
              />
            </div>

            {/* Swap Button */}
            <div className="flex items-end justify-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSwap}
                className="rounded-full"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* To */}
            <div className="space-y-2">
              <Label htmlFor="to" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                To
              </Label>
              <Input
                id="to"
                type="text"
                placeholder="Enter destination city"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
                className="h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Travel Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                required
                className="h-12"
              />
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <Label htmlFor="adults" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Passengers
              </Label>
              <Input
                id="adults"
                type="number"
                min="1"
                max="10"
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                required
                className="h-12"
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isLoading || !from || !to || !date}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Search className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Buses
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BusSearch;


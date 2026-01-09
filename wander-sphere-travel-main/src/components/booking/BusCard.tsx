import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Star, ArrowRight, User } from "lucide-react";
import { BusSearchResult } from "@/services/etravService";
import { cn } from "@/lib/utils";

interface BusCardProps {
  bus: BusSearchResult;
  onSelect: (bus: BusSearchResult) => void;
  index: number;
}

const BusCard: React.FC<BusCardProps> = ({ bus, onSelect, index }) => {
  const formatTime = (time: string) => {
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return time;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div 
        className="group relative bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(8,145,178,0.15)]"
      >
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
          {/* Left: Operator & Type */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            <h3 className="text-lg md:text-xl font-bold text-white truncate">{bus.operatorName || 'Premium Travels'}</h3>
            <p className="text-sm text-slate-400 mt-1 truncate">
              {bus.busType || 'Volvo Multi-Axle AC Sleeper'}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <span className="flex items-center gap-1 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded border border-green-500/30">
                <Star className="w-3 h-3 fill-current" /> 4.8
              </span>
              <span className="text-xs text-slate-500">240 ratings</span>
            </div>
          </div>

          {/* Center: Timing */}
          <div className="flex items-center gap-2 md:gap-6 flex-1 justify-center min-w-fit">
            <div className="text-center">
              <p className="text-lg md:text-xl font-bold text-white">{formatTime(bus.departureTime)}</p>
              <p className="text-xs text-slate-500">Departure</p>
            </div>
            
            <div className="flex flex-col items-center px-4 relative">
                <div className="w-16 md:w-24 h-[1px] bg-slate-700" />
                <p className="text-xs text-slate-400 mt-1">{bus.duration || '12h 30m'}</p>
            </div>

            <div className="text-center">
              <p className="text-lg md:text-xl font-bold text-white">{formatTime(bus.arrivalTime)}</p>
              <p className="text-xs text-slate-500">Arrival</p>
            </div>
          </div>

          {/* Right: Price & CTA */}
          <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 justify-between w-full md:w-auto border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
             <div className="text-left md:text-right">
                <p className="text-xs text-slate-400">Starting from</p>
                <p className="text-xl md:text-2xl font-bold text-cyan-400">₹{bus.price?.toLocaleString('en-IN') || '899'}</p>
             </div>

             <Button
                onClick={() => onSelect(bus)}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:shadow-[0_0_15px_rgba(8,145,178,0.3)] transition-all duration-300"
             >
                Select Seats
             </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BusCard;

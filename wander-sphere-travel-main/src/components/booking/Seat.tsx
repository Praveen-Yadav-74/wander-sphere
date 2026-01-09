import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

export type SeatStatus = 'available' | 'booked' | 'selected' | 'ladies';
export type SeatType = 'seater' | 'sleeper';

interface SeatProps {
  id: string;
  type: SeatType;
  status: SeatStatus;
  price: number;
  row?: number;
  col?: number;
  onClick?: (id: string) => void;
  className?: string;
}

const Seat: React.FC<SeatProps> = ({
  id,
  type,
  status,
  price,
  onClick,
  className
}) => {
  const isBooked = status === 'booked';
  const isSelected = status === 'selected';
  const isLadies = status === 'ladies';

  // Base styles for the seat container
  const baseStyles = cn(
    "relative flex flex-col items-center justify-center transition-all duration-300",
    "border backdrop-blur-md rounded-lg",
    isBooked ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]",
    className
  );

  // Status-specific styles
  const statusStyles = () => {
    if (isBooked) return "bg-gray-800 border-gray-600 text-gray-500";
    if (isSelected) return "bg-green-500/20 border-green-400 shadow-[0_0_10px_#4ade80] text-green-400";
    if (isLadies) return "bg-pink-500/10 border-pink-400 text-pink-400";
    return "bg-white/5 border-white/20 hover:border-cyan-400 hover:bg-cyan-950/30 text-gray-300 hover:text-cyan-300";
  };

  // Shape styles (Seater vs Sleeper)
  const shapeStyles = type === 'seater' 
    ? "w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16" 
    : "w-12 h-24 sm:w-14 sm:h-28 lg:w-16 lg:h-32";

  return (
    <motion.div
      whileHover={!isBooked ? { scale: 1.05 } : {}}
      whileTap={!isBooked ? { scale: 0.95 } : {}}
      onClick={() => !isBooked && onClick?.(id)}
      className={cn(baseStyles, statusStyles(), shapeStyles)}
    >
      {/* Seat Icon / Number */}
      <div className="flex flex-col items-center justify-center z-10">
         {isBooked ? (
            <User className="w-5 h-5 mb-1" />
         ) : (
            <>
              <span className="text-xs font-bold mb-1">{id}</span>
              <span className="text-[10px] font-medium opacity-80">₹{price}</span>
            </>
         )}
      </div>

      {/* Decorative Glow Elements for Cyberpunk feel */}
      {!isBooked && (
        <>
            {/* Top accent */}
            <div className={cn(
                "absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px]",
                isSelected ? "bg-green-400 shadow-[0_0_5px_#4ade80]" : "bg-cyan-500/30"
            )} />
            
            {/* Sleeper Headrest indicator */}
            {type === 'sleeper' && (
                <div className={cn(
                    "absolute top-2 w-3/4 h-1 rounded-full",
                    isSelected ? "bg-green-500/40" : "bg-white/10"
                )} />
            )}
            
            {/* Bottom accent */}
             <div className={cn(
                "absolute bottom-0 w-full h-[1px]",
                isSelected ? "bg-green-500/50" : "bg-transparent"
            )} />
        </>
      )}
      
      {/* Selected Indicator Ring */}
      {isSelected && (
        <motion.div
            layoutId="selected-ring"
            className="absolute inset-0 rounded-lg border-2 border-green-400 opacity-50"
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

export default Seat;

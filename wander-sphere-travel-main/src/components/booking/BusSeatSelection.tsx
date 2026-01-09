import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronRight, Info, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Seat, { SeatType, SeatStatus } from './Seat';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BusSearchResult } from '@/services/etravService';

// --- MOCK DATA ---
const LOWER_DECK: { id: string, type: SeatType, status: SeatStatus, price: number, row: number, col: number }[] = [
    // Driver side is typically right in India, let's assume standard layout
    // Row 1
    { id: 'L1', type: 'seater', status: 'booked', price: 800, row: 1, col: 1 },
    { id: 'L2', type: 'seater', status: 'available', price: 800, row: 1, col: 2 },
    { id: 'L3', type: 'seater', status: 'available', price: 800, row: 1, col: 4 }, // Aisle gap at 3
    
    // Row 2
    { id: 'L4', type: 'seater', status: 'available', price: 800, row: 2, col: 1 },
    { id: 'L5', type: 'seater', status: 'available', price: 800, row: 2, col: 2 },
    { id: 'L6', type: 'seater', status: 'ladies', price: 800, row: 2, col: 4 },

     // Row 3
    { id: 'L7', type: 'seater', status: 'available', price: 800, row: 3, col: 1 },
    { id: 'L8', type: 'seater', status: 'booked', price: 800, row: 3, col: 2 },
    { id: 'L9', type: 'seater', status: 'available', price: 800, row: 3, col: 4 },
    
     // Row 4 (Sleeper mixed)
    { id: 'L10', type: 'sleeper', status: 'available', price: 1200, row: 4, col: 1 },
    { id: 'L11', type: 'sleeper', status: 'available', price: 1200, row: 4, col: 4 },
];

const UPPER_DECK: { id: string, type: SeatType, status: SeatStatus, price: number, row: number, col: number }[] = [
    // All sleepers usually
    { id: 'U1', type: 'sleeper', status: 'available', price: 1500, row: 1, col: 1 },
    { id: 'U2', type: 'sleeper', status: 'booked', price: 1500, row: 1, col: 2 },
    { id: 'U3', type: 'sleeper', status: 'available', price: 1500, row: 1, col: 4 },

    { id: 'U4', type: 'sleeper', status: 'available', price: 1500, row: 2, col: 1 },
    { id: 'U5', type: 'sleeper', status: 'available', price: 1500, row: 2, col: 2 },
    { id: 'U6', type: 'sleeper', status: 'available', price: 1500, row: 2, col: 4 },

    { id: 'U7', type: 'sleeper', status: 'available', price: 1500, row: 3, col: 1 },
    { id: 'U8', type: 'sleeper', status: 'booked', price: 1500, row: 3, col: 2 },
    { id: 'U9', type: 'sleeper', status: 'available', price: 1500, row: 3, col: 4 },
];

interface BusSeatSelectionProps {
  selectedBus?: BusSearchResult | null;
  onNext?: (data: { seats: string[], boardingPoint: string, droppingPoint: string }) => void;
  onBack?: () => void;
}

const BusSeatSelection: React.FC<BusSeatSelectionProps> = ({ selectedBus, onNext, onBack }) => {
    const [selectedDeck, setSelectedDeck] = useState<'lower' | 'upper'>('lower');
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [boardingPoint, setBoardingPoint] = useState<string>('');
    const [droppingPoint, setDroppingPoint] = useState<string>('');
    const { toast } = useToast();

    // Helper to find seat by ID from both decks
    const findSeat = (id: string) => [...LOWER_DECK, ...UPPER_DECK].find(s => s.id === id);

    const toggleSeat = (id: string) => {
        setSelectedSeats(prev => {
            if (prev.includes(id)) {
                return prev.filter(s => s !== id);
            } else {
                if (prev.length >= 6) {
                    toast({
                        title: "Limit Reached",
                        description: "You can strictly select up to 6 seats.",
                        variant: "destructive"
                    });
                    return prev;
                }
                return [...prev, id];
            }
        });
    };

    const handleProceed = () => {
        if (!boardingPoint || !droppingPoint) {
            toast({
                title: "Missing Information",
                description: "Please select boarding and dropping points.",
                variant: "destructive"
            });
            return;
        }
        onNext?.({ seats: selectedSeats, boardingPoint, droppingPoint });
    }

    const totalPrice = selectedSeats.reduce((acc, id) => {
        const seat = findSeat(id);
        return acc + (seat?.price || 0);
    }, 0);

    const activeSeats = selectedDeck === 'lower' ? LOWER_DECK : UPPER_DECK;

    // Grid rendering helper
    const renderGrid = () => {
        const grid = [];
        const maxRow = Math.max(...activeSeats.map(s => s.row));
        
        for (let r = 1; r <= maxRow; r++) {
            const rowSeats = activeSeats.filter(s => s.row === r);
            
            // Create a row container
            const rowElements = (
                <div key={`row-${r}`} className="flex gap-4 mb-4 justify-between items-center w-full px-8">
                    {/* Left Side (Col 1 & 2) */}
                    <div className="flex gap-2 sm:gap-4">
                         {/* Slot 1 */}
                        {renderSlot(rowSeats.find(s => s.col === 1))}
                         {/* Slot 2 */}
                        {renderSlot(rowSeats.find(s => s.col === 2))}
                    </div>

                    {/* Aisle Spacer */}
                    <div className="flex-1 text-center opacity-20 text-[10px] tracking-widest rotate-90 sm:rotate-0">
                        AISLE
                    </div>

                    {/* Right Side (Col 4 - assuming 3 is aisle) */}
                    <div className="flex gap-2 sm:gap-4">
                         {/* Slot 4 */}
                         {renderSlot(rowSeats.find(s => s.col === 4))}
                    </div>
                </div>
            );
            grid.push(rowElements);
        }
        return grid;
    };

    const renderSlot = (seat: typeof LOWER_DECK[0] | undefined) => {
        if (!seat) return <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 opacity-0" />; // Empty placeholder
        
        // Check if selected
        let status = seat.status;
        if (selectedSeats.includes(seat.id)) {
            status = 'selected';
        }

        return (
            <Seat
                key={seat.id}
                id={seat.id}
                type={seat.type}
                status={status}
                price={seat.price}
                onClick={toggleSeat}
            />
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
             <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 pb-48">
                {/* Header */}
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-400 hover:text-white hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                Select Seats
                            </h1>
                            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                {selectedBus?.operatorName || 'Volvo AC'} • {selectedBus?.departureTime ? new Date(selectedBus.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '23:00'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Deck Switcher */}
                    <div className="bg-slate-900/50 backdrop-blur-md p-1 rounded-xl border border-white/10 flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setSelectedDeck('lower')}
                            className={cn(
                                "flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2",
                                selectedDeck === 'lower' 
                                    ? "bg-cyan-600/20 text-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.2)] border border-cyan-500/30" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Layers className="w-4 h-4 rotate-180" /> Lower Deck
                        </button>
                        <button
                             onClick={() => setSelectedDeck('upper')}
                             className={cn(
                                "flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2",
                                selectedDeck === 'upper' 
                                    ? "bg-purple-600/20 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.2)] border border-purple-500/30" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Layers className="w-4 h-4" /> Upper Deck
                        </button>
                    </div>
                </header>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 sm:gap-8 justify-center mb-10 text-xs sm:text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-white/20 bg-white/5" /> Available
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded border border-green-500 bg-green-500/20 shadow-[0_0_5px_#4ade80]" /> Selected
                    </div>
                     <div className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded border border-gray-700 bg-gray-800" /> Booked
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded border border-pink-500 bg-pink-500/10" /> Ladies
                    </div>
                </div>

                {/* Seat Map Container */}
                <div className="relative mb-12">
                     {/* Bus Body shape */}
                    <div className="absolute inset-0 -mx-4 sm:-mx-8 bg-slate-900/40 backdrop-blur-xl border-x border-t border-white/10 rounded-t-[3rem] -z-10" />
                    
                    {/* Front of bus indicator */}
                    <div className="text-center pb-8 pt-4">
                        <div className="w-16 h-1 mx-auto bg-slate-700 rounded-full mb-1" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Front</span>
                    </div>

                    {/* Seats Grid */}
                    <div className="min-h-[400px] pb-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedDeck}
                                initial={{ opacity: 0, x: selectedDeck === 'lower' ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: selectedDeck === 'lower' ? 20 : -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center"
                            >
                                {renderGrid()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Boarding & Dropping Points */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-white/10"
                >
                    <div className="space-y-3">
                        <label className="text-sm text-slate-400 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-cyan-400" /> Boarding Point
                        </label>
                        <Select onValueChange={setBoardingPoint}>
                            <SelectTrigger className="bg-slate-950/50 border-white/10 text-white h-12">
                                <SelectValue placeholder="Select boarding point" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="dadar">Dadar East (23:00)</SelectItem>
                                <SelectItem value="sion">Sion Circle (23:15)</SelectItem>
                                <SelectItem value="vashi">Vashi Plaza (23:45)</SelectItem>
                                <SelectItem value="panvel">Panvel (00:15)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm text-slate-400 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-400" /> Dropping Point
                        </label>
                        <Select onValueChange={setDroppingPoint}>
                            <SelectTrigger className="bg-slate-950/50 border-white/10 text-white h-12">
                                <SelectValue placeholder="Select dropping point" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="mapusa">Mapusa (09:00)</SelectItem>
                                <SelectItem value="panjim">Panjim (10:00)</SelectItem>
                                <SelectItem value="margao">Margao (11:00)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </motion.div>
             </div>

             {/* Footer - Booking Summary */}
             <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 p-4 sm:p-6 pb-8">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-sm">Total Price</span>
                            <span className="text-2xl font-bold text-white">₹{totalPrice}</span>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2" />
                        <div className="flex flex-col">
                             <span className="text-slate-400 text-sm">Seats</span>
                             <span className="text-white font-medium">
                                {selectedSeats.length > 0 ? selectedSeats.join(', ') : '-'}
                             </span>
                        </div>
                    </div>
                    
                    <Button 
                        disabled={selectedSeats.length === 0 || !boardingPoint || !droppingPoint}
                        onClick={handleProceed}
                        className={cn(
                            "w-full sm:w-auto px-8 py-6 text-lg rounded-xl transition-all duration-300",
                            selectedSeats.length > 0 && boardingPoint && droppingPoint
                                ? "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-[0_0_20px_rgba(8,145,178,0.4)]" 
                                : "bg-slate-800 text-slate-500"
                        )}
                    >
                        Proceed to Details
                    </Button>
                </div>
             </div>
        </div>
    );
};

export default BusSeatSelection;

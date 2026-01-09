import React, { useState } from 'react';
import { ArrowLeft, Check, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import BookingPayment from '@/components/booking/BookingPayment';

// Mock Data for Bus Layout
const LOWER_DECK = [
  { id: 'L1', type: 'sleeper', price: 1200, status: 'available' }, { id: 'L2', type: 'sleeper', price: 1200, status: 'booked' }, { id: 'L3', type: 'sleeper', price: 1200, status: 'available' },
  { id: 'L4', type: 'sleeper', price: 1250, status: 'ladies' }, { id: 'L5', type: 'sleeper', price: 1200, status: 'available' }, { id: 'L6', type: 'sleeper', price: 1200, status: 'selected' },
];

const UPPER_DECK = [
    { id: 'U1', type: 'sleeper', price: 1400, status: 'available' }, { id: 'U2', type: 'sleeper', price: 1400, status: 'available' }, { id: 'U3', type: 'sleeper', price: 1400, status: 'booked' },
    { id: 'U4', type: 'sleeper', price: 1400, status: 'available' }, { id: 'U5', type: 'sleeper', price: 1400, status: 'available' }, { id: 'U6', type: 'sleeper', price: 1400, status: 'available' },
];

const Seat = ({ seat, onSelect }: { seat: any, onSelect: (id: string) => void }) => {
    const isSelected = seat.status === 'selected';
    const isBooked = seat.status === 'booked';
    const isLadies = seat.status === 'ladies';

    return (
        <button
            disabled={isBooked}
            onClick={() => onSelect(seat.id)}
            className={cn(
                "relative transition-all duration-200 p-2 rounded-lg border flex flex-col items-center justify-center gap-1",
                seat.type === 'sleeper' ? "w-14 h-24" : "w-12 h-12",
                isBooked ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60" :
                isSelected ? "bg-indigo-600 border-indigo-600 shadow-md transform scale-105" :
                isLadies ? "bg-pink-50 border-pink-200 hover:border-pink-300" :
                "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm"
            )}
        >
            {seat.type === 'sleeper' && (
                <div className={cn("w-8 h-1.5 rounded-sm mb-1", isSelected ? "bg-white/30" : "bg-gray-200")} />
            )}
            
            {isBooked ? (
                <User className="w-5 h-5 text-gray-300" />
            ) : isSelected ? (
                <Check className="w-5 h-5 text-white" />
            ) : (
                <span className={cn("text-xs font-bold", isLadies ? "text-pink-400" : "text-gray-400")}>
                    {seat.id}
                </span>
            )}

            {!isBooked && !isSelected && (
                 <span className="text-[10px] text-gray-500 font-medium">₹{seat.price}</span>
            )}
        </button>
    );
};

const BusSeatSelection = () => {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<'lower' | 'upper'>('lower');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [step, setStep] = useState<'seats' | 'payment'>('seats');

  const currentSeats = deck === 'lower' ? LOWER_DECK : UPPER_DECK;

  const toggleSeat = (id: string) => {
      if (selectedSeats.includes(id)) {
          setSelectedSeats(prev => prev.filter(s => s !== id));
      } else {
          if (selectedSeats.length < 6) {
             setSelectedSeats(prev => [...prev, id]);
          }
      }
  };

  const totalPrice = selectedSeats.length * 1200;

  if (step === 'payment') {
      return (
          <div className="min-h-screen bg-gray-50 pb-20">
              <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
                    <Button variant="ghost" onClick={() => setStep('seats')} className="mr-2">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg font-bold">Checkout</h1>
                </div>
              </div>
              <BookingPayment type="bus" amount={totalPrice} />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
             <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>
                <div className="text-center">
                    <h1 className="text-sm font-bold text-gray-900">Bangalore <span className="text-gray-400">→</span> Goa</h1>
                    <p className="text-xs text-gray-500">Today, 22:00 • Orange Travels</p>
                </div>
                <div className="w-10" /> 
             </div>
        </div>

        {/* Legend */}
        <div className="max-w-md mx-auto p-4 flex justify-center gap-4 text-xs text-gray-500 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white border border-gray-300" /> Available</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Booked</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-indigo-600" /> Selected</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-pink-50 border border-pink-200" /> Ladies</div>
        </div>

        {/* Deck Switcher */}
        <div className="flex justify-center my-6">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
                 <button 
                    onClick={() => setDeck('lower')}
                    className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", deck === 'lower' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50")}
                 >
                    Lower Deck
                 </button>
                 <button 
                    onClick={() => setDeck('upper')}
                    className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", deck === 'upper' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50")}
                 >
                    Upper Deck
                 </button>
            </div>
        </div>

        {/* Layout */}
        <div className="max-w-xs mx-auto bg-white rounded-[2rem] border-2 border-gray-200 p-8 relative shadow-xl min-h-[400px]">
             {/* Steering Wheel Icon (Image) */}
            <div className="absolute top-4 right-4 w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center">
                 <img src="https://cdn-icons-png.flaticon.com/512/5029/5029196.png" className="w-6 h-6 opacity-30" alt="steering" />
            </div>

            <div className="grid grid-cols-3 gap-x-8 gap-y-4 mt-10">
                <div className="flex flex-col gap-4">
                    {currentSeats.slice(0, 3).map(seat => (
                        <Seat key={seat.id} seat={{...seat, status: selectedSeats.includes(seat.id) ? 'selected' : seat.status}} onSelect={toggleSeat} />
                    ))}
                </div>
                <div />
                <div className="flex flex-col gap-4">
                     {currentSeats.slice(3, 6).map(seat => (
                        <Seat key={seat.id} seat={{...seat, status: selectedSeats.includes(seat.id) ? 'selected' : seat.status}} onSelect={toggleSeat} />
                    ))}
                </div>
            </div>
        </div>

        {/* Booking Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
             <div className="max-w-md mx-auto flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500">{selectedSeats.length} Seats | {selectedSeats.join(', ')}</p>
                    <p className="text-xl font-bold text-gray-900">₹{totalPrice.toLocaleString()}</p>
                </div>
                <Button 
                    disabled={selectedSeats.length === 0}
                    onClick={() => setStep('payment')}
                    className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                    Proceed to Pay
                </Button>
             </div>
        </div>
    </div>
  );
};

export default BusSeatSelection;

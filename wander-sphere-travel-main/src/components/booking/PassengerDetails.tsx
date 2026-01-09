import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { BusSearchResult } from '@/services/etravService';

interface PassengerDetailsProps {
  selectedSeats: string[];
  selectedBus: BusSearchResult | null;
  onBack: () => void;
  onPayment: (passengers: any[]) => void;
}

const PassengerDetails: React.FC<PassengerDetailsProps> = ({ 
  selectedSeats, 
  selectedBus,
  onBack,
  onPayment 
}) => {
  const [passengers, setPassengers] = useState(
    selectedSeats.map(seat => ({
      seatNumber: seat,
      fullName: '',
      age: '',
      gender: 'male'
    }))
  );

  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: ''
  });

  const handlePassengerChange = (index: number, field: string, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const calculateTotal = () => {
    const basePrice = (selectedBus?.price || 0) * selectedSeats.length;
    const tax = basePrice * 0.18; // 18% GST example
    return { basePrice, tax, total: basePrice + tax };
  };

  const { basePrice, tax, total } = calculateTotal();

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-32">
      {/* Forms Section */}
      <div className="flex-1 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Passenger Information
            </h2>

            <div className="space-y-6">
              {passengers.map((passenger, index) => (
                <div key={passenger.seatNumber} className="relative p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors">
                  <div className="absolute -top-3 -left-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                    Seat {passenger.seatNumber}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label className="text-slate-400">Full Name</Label>
                      <Input 
                        value={passenger.fullName}
                        onChange={(e) => handlePassengerChange(index, 'fullName', e.target.value)}
                        className="bg-slate-950/50 border-white/10 focus:border-cyan-500 text-white placeholder:text-slate-600"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">Age</Label>
                      <Input 
                        type="number"
                        value={passenger.age}
                        onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                        className="bg-slate-950/50 border-white/10 focus:border-cyan-500 text-white placeholder:text-slate-600"
                        placeholder="25"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">Gender</Label>
                      <RadioGroup 
                        defaultValue="male" 
                        onValueChange={(val) => handlePassengerChange(index, 'gender', val)}
                        className="flex gap-4 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id={`m-${index}`} className="border-cyan-500 text-cyan-500" />
                          <Label htmlFor={`m-${index}`} className="text-white">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id={`f-${index}`} className="border-pink-500 text-pink-500" />
                          <Label htmlFor={`f-${index}`} className="text-white">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              Contact Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input 
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                    className="pl-10 bg-slate-950/50 border-white/10 focus:border-purple-500 text-white"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input 
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                    className="pl-10 bg-slate-950/50 border-white/10 focus:border-purple-500 text-white"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bill Summary - Floating/Sticky Side */}
      <div className="lg:w-80">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="sticky top-6 space-y-6"
        >
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 rounded-2xl border border-white/10 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-4">Fare Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Base Fare ({selectedSeats.length} seats)</span>
                <span>₹{basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Tax & Fees (18%)</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between text-white font-bold text-lg">
                <span>Grand Total</span>
                <span className="text-green-400">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <Button 
              onClick={() => onPayment([...passengers, contactInfo])}
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 py-6 text-lg font-bold shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all duration-300 transform hover:scale-[1.02]"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Proceed to Pay
            </Button>
            
            <Button 
                variant="ghost" 
                onClick={onBack}
                className="w-full mt-2 text-slate-400 hover:text-white"
            >
                Back to Seats
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PassengerDetails;

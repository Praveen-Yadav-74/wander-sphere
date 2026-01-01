import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import BusSearch from "@/components/booking/BusSearch";
import BusCard from "@/components/booking/BusCard";
import BusSeatLayout from "@/components/booking/BusSeatLayout";
import { etravService, BusSearchResult, SeatLayout, PassengerDetails } from "@/services/etravService";
import { walletService } from "@/services/walletService";

type BookingStep = 'search' | 'results' | 'seats' | 'passengers' | 'payment' | 'confirmation';

const BusBooking: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('search');
  const [isLoading, setIsLoading] = useState(false);
  
  // Search state
  const [searchParams, setSearchParams] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<BusSearchResult[]>([]);
  
  // Selection state
  const [selectedBus, setSelectedBus] = useState<BusSearchResult | null>(null);
  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [blockId, setBlockId] = useState<string | null>(null);
  
  // Passenger & Booking state
  const [passengerDetails, setPassengerDetails] = useState<PassengerDetails[]>([]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [pnr, setPnr] = useState<string | null>(null);

  const handleSearch = async (params: any) => {
    setIsLoading(true);
    setSearchParams(params);
    
    try {
      const response = await etravService.searchBuses(params);
      
      if (response.success && response.data) {
        setSearchResults(response.data);
        setCurrentStep('results');
      } else {
        toast({
          title: "Search Failed",
          description: response.message || "No buses found for this route",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search buses",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBus = async (bus: BusSearchResult) => {
    setSelectedBus(bus);
    setIsLoading(true);
    
    try {
      const response = await etravService.getBusSeatLayout(bus.tripId);
      
      if (response.success && response.data) {
        setSeatLayout(response.data);
        setCurrentStep('seats');
      } else {
        toast({
          title: "Error",
          description: "Failed to load seat layout",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load seat layout",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatSelect = async (seatNumbers: string[]) => {
    if (!selectedBus || seatNumbers.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // For now, create dummy passenger details
      // In production, you'd have a form to collect this
      const dummyPassengers: PassengerDetails[] = seatNumbers.map((_, index) => ({
        title: 'Mr',
        firstName: user?.firstName || 'Passenger',
        lastName: user?.lastName || `${index + 1}`,
        age: 25,
        gender: 'Male' as 'Male' | 'Female',
        email: user?.email || '',
        phone: user?.phone || ''
      }));

      setPassengerDetails(dummyPassengers);
      
      // Block seats
      const blockResponse = await etravService.blockBusSeats(
        selectedBus.tripId,
        seatNumbers,
        dummyPassengers
      );
      
      if (blockResponse.success && blockResponse.data) {
        setBlockId(blockResponse.data.blockId);
        setSelectedSeats(seatNumbers);
        setCurrentStep('payment');
      } else {
        toast({
          title: "Error",
          description: "Failed to block seats",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to block seats",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedBus || !blockId || selectedSeats.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Calculate total amount
      const totalAmount = selectedSeats.length * (selectedBus.price || 0);
      
      // Create Razorpay order
      const { orderId, razorpayOrder } = await walletService.addFunds(totalAmount);
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'WanderSphere',
          description: `Bus booking - ${selectedSeats.length} seat(s)`,
          order_id: orderId,
          handler: async (response: any) => {
            try {
              // Book the ticket
              const bookResponse = await etravService.bookBus(
                blockId,
                response.razorpay_payment_id,
                response.razorpay_order_id,
                {
                  totalAmount: totalAmount,
                  currency: 'INR'
                }
              );
              
              if (bookResponse.success && bookResponse.data) {
                setPnr(bookResponse.data.pnr);
                setBookingConfirmed(true);
                setCurrentStep('confirmation');
                
                toast({
                  title: "Booking Confirmed!",
                  description: `Your PNR is: ${bookResponse.data.pnr}`,
                });
              } else {
                throw new Error(bookResponse.message || "Booking failed");
              }
            } catch (error: any) {
              toast({
                title: "Booking Failed",
                description: error.message || "Failed to confirm booking",
                variant: "destructive"
              });
            } finally {
              setIsLoading(false);
            }
          },
          prefill: {
            email: user?.email || '',
            name: `${user?.firstName} ${user?.lastName}`.trim() || 'User',
          },
          theme: {
            color: '#6366f1',
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
            }
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      };

      document.body.appendChild(script);
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'search':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/booking')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">Book Bus Tickets</h1>
            </div>
            <BusSearch onSearch={handleSearch} isLoading={isLoading} />
          </div>
        );

      case 'results':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" onClick={() => setCurrentStep('search')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Search
                </Button>
                <h2 className="text-2xl font-bold mt-2">
                  {searchResults.length} buses found
                </h2>
              </div>
            </div>
            <div className="space-y-4">
              {searchResults.map((bus, index) => (
                <BusCard key={index} bus={bus} onSelect={handleSelectBus} />
              ))}
            </div>
          </div>
        );

      case 'seats':
        return seatLayout ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" onClick={() => setCurrentStep('results')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Results
                </Button>
                <h2 className="text-2xl font-bold mt-2">Select Your Seats</h2>
                <p className="text-muted-foreground">
                  {selectedBus?.operatorName} - {selectedBus?.busType}
                </p>
              </div>
            </div>
            <BusSeatLayout
              seatLayout={seatLayout}
              onSeatSelect={handleSeatSelect}
              selectedSeats={selectedSeats}
              maxSeats={6}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading seat layout...</p>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold">{selectedBus?.operatorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBus?.busType} • {selectedSeats.length} seat(s)
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ₹{(selectedSeats.length * (selectedBus?.price || 0)).toLocaleString('en-IN')}
                  </p>
                </div>
                <Button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-6">
            <Card className="border-green-500">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
                {pnr && (
                  <p className="text-xl mb-4">
                    Your PNR: <span className="font-bold text-primary">{pnr}</span>
                  </p>
                )}
                <p className="text-muted-foreground mb-6">
                  Your booking details have been sent to your email.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => navigate('/booking')}>
                    View My Bookings
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setCurrentStep('search');
                    setSearchResults([]);
                    setSelectedBus(null);
                    setSelectedSeats([]);
                    setBookingConfirmed(false);
                  }}>
                    Book Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {renderStep()}
    </div>
  );
};

export default BusBooking;


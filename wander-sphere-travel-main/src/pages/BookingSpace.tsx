import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, Plane, Hotel, Calendar, MapPin, Users, Search, Shield, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import BookingWalletWidget from "@/components/wallet/BookingWalletWidget";
import { cn } from "@/lib/utils";

const BookingSpace = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bus' | 'flight' | 'hotel'>('bus');
  
  // Bus search state
  const [busSearch, setBusSearch] = useState({
    from: '',
    to: '',
    date: ''
  });
  
  // Flight search state
  const [flightSearch, setFlightSearch] = useState({
    from: '',
    to: '',
    date: '',
    returnDate: '',
    passengers: 1
  });
  
  // Hotel search state
  const [hotelSearch, setHotelSearch] = useState({
    city: '',
    checkIn: '',
    checkOut: '',
    guests: 1
  });

  const handleBusSearch = () => {
    if (busSearch.from && busSearch.to && busSearch.date) {
      navigate('/booking/bus', { 
        state: { 
          searchParams: busSearch 
        } 
      });
    }
  };

  const handleFlightSearch = () => {
    // Navigate to flight booking when implemented
    console.log('Flight search:', flightSearch);
  };

  const handleHotelSearch = () => {
    // Navigate to hotel booking when implemented
    console.log('Hotel search:', hotelSearch);
  };

  // Trusted partners logos (you can replace with actual logo URLs)
  const partners = [
    { name: 'IndiGo', icon: '✈️' },
    { name: 'Air India', icon: '✈️' },
    { name: 'Vistara', icon: '✈️' },
    { name: 'SpiceJet', icon: '✈️' },
    { name: 'RedBus', icon: '🚌' },
    { name: 'Volvo', icon: '🚌' },
    { name: 'Marriott', icon: '🏨' },
    { name: 'Taj Hotels', icon: '🏨' },
    { name: 'OYO', icon: '🏨' },
    { name: 'MakeMyTrip', icon: '🌐' },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Your transactions are protected with bank-level encryption',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Clock,
      title: 'Instant Confirmation',
      description: 'Get your booking confirmed within seconds',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: CheckCircle2,
      title: 'Best Price Guarantee',
      description: 'We match any lower price you find elsewhere',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Wallet Widget */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <BookingWalletWidget />
      </div>

      {/* Hero Section with Glassmorphism Search */}
      <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background Gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        />
        
        {/* Floating orbs for depth */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <motion.h1
              className="text-5xl md:text-6xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Your Journey Starts Here
            </motion.h1>
            <motion.p
              className="text-xl text-white/90 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Book buses, flights, and hotels with ease. Trusted by millions of travelers.
            </motion.p>
          </motion.div>

          {/* Glassmorphism Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl shadow-2xl p-6 md:p-8"
          >
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'bus' | 'flight' | 'hotel')} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm mb-6">
                <TabsTrigger 
                  value="bus" 
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  <Bus className="w-4 h-4 mr-2" />
                  Bus
                </TabsTrigger>
                <TabsTrigger 
                  value="flight"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  <Plane className="w-4 h-4 mr-2" />
                  Flight
                </TabsTrigger>
                <TabsTrigger 
                  value="hotel"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  <Hotel className="w-4 h-4 mr-2" />
                  Hotel
                </TabsTrigger>
              </TabsList>

              {/* Bus Search */}
              <TabsContent value="bus" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      From
                    </Label>
                    <Input
                      placeholder="Enter origin city"
                      value={busSearch.from}
                      onChange={(e) => setBusSearch({ ...busSearch, from: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      To
                    </Label>
                    <Input
                      placeholder="Enter destination city"
                      value={busSearch.to}
                      onChange={(e) => setBusSearch({ ...busSearch, to: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Travel Date
                    </Label>
                    <Input
                      type="date"
                      value={busSearch.date}
                      onChange={(e) => setBusSearch({ ...busSearch, date: e.target.value })}
                      min={today}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleBusSearch}
                  disabled={!busSearch.from || !busSearch.to || !busSearch.date}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6 shadow-lg relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Buses
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                </Button>
              </TabsContent>

              {/* Flight Search */}
              <TabsContent value="flight" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      From
                    </Label>
                    <Input
                      placeholder="Enter origin"
                      value={flightSearch.from}
                      onChange={(e) => setFlightSearch({ ...flightSearch, from: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      To
                    </Label>
                    <Input
                      placeholder="Enter destination"
                      value={flightSearch.to}
                      onChange={(e) => setFlightSearch({ ...flightSearch, to: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Departure
                    </Label>
                    <Input
                      type="date"
                      value={flightSearch.date}
                      onChange={(e) => setFlightSearch({ ...flightSearch, date: e.target.value })}
                      min={today}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Passengers
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="9"
                      value={flightSearch.passengers}
                      onChange={(e) => setFlightSearch({ ...flightSearch, passengers: parseInt(e.target.value) || 1 })}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleFlightSearch}
                  disabled={!flightSearch.from || !flightSearch.to || !flightSearch.date}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6 shadow-lg relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Flights
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                </Button>
              </TabsContent>

              {/* Hotel Search */}
              <TabsContent value="hotel" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      City or Hotel
                    </Label>
                    <Input
                      placeholder="Enter city or hotel name"
                      value={hotelSearch.city}
                      onChange={(e) => setHotelSearch({ ...hotelSearch, city: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Check-in
                    </Label>
                    <Input
                      type="date"
                      value={hotelSearch.checkIn}
                      onChange={(e) => setHotelSearch({ ...hotelSearch, checkIn: e.target.value })}
                      min={today}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Check-out
                    </Label>
                    <Input
                      type="date"
                      value={hotelSearch.checkOut}
                      onChange={(e) => setHotelSearch({ ...hotelSearch, checkOut: e.target.value })}
                      min={hotelSearch.checkIn || today}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Guests
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={hotelSearch.guests}
                      onChange={(e) => setHotelSearch({ ...hotelSearch, guests: parseInt(e.target.value) || 1 })}
                      className="bg-white/90 backdrop-blur-sm border-white/30"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleHotelSearch}
                  disabled={!hotelSearch.city || !hotelSearch.checkIn || !hotelSearch.checkOut}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6 shadow-lg relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Hotels
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                </Button>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Trusted Partners Marquee */}
      <div className="py-12 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <p className="text-sm text-gray-600 mb-4">Trusted by 50+ Partners</p>
            <div className="relative overflow-hidden">
              <div className="flex gap-8 animate-scroll">
                {[...partners, ...partners].map((partner, index) => (
                  <motion.div
                    key={index}
                    className="flex-shrink-0 flex items-center justify-center w-32 h-16 bg-white rounded-lg shadow-sm border border-gray-200 px-4 hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-2xl mr-2">{partner.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{partner.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose WanderSphere?</h2>
          <p className="text-xl text-gray-600">Experience travel booking like never before</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl">
                <CardContent className="p-8">
                  <motion.div
                    className={cn(
                      "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg",
                      feature.color
                    )}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default BookingSpace;

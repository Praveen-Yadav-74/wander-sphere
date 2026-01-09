import React from 'react';
import { Plane, Hotel, Bus, Clock, Star, MapPin, ArrowRight, User, Wifi, Coffee, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type ResultType = 'flight' | 'hotel' | 'bus';

interface SearchResultsProps {
    type: ResultType;
    searchParams?: any;
}

// --- Mock Data ---

const MOCK_FLIGHTS = [
    { id: 'f1', airline: 'Indigo', code: '6E 505', time: '06:00 - 08:30', duration: '2h 30m', price: 4500, logo: 'https://images.ixigo.com/img/common-resources/airline-new/6E.png', stops: 'Non Stop' },
    { id: 'f2', airline: 'Air India', code: 'AI 808', time: '10:15 - 13:00', duration: '2h 45m', price: 5200, logo: 'https://images.ixigo.com/img/common-resources/airline-new/AI.png', stops: 'Non Stop' },
    { id: 'f3', airline: 'Vistara', code: 'UK 992', time: '16:00 - 19:30', duration: '3h 30m', price: 6100, logo: 'https://images.ixigo.com/img/common-resources/airline-new/UK.png', stops: '1 Stop' },
];

const MOCK_HOTELS = [
    { id: 'h1', name: 'The Oberoi', rating: 4.9, location: 'Mumbai, India', price: 18000, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000', amenities: ['Free Wifi', 'Breakfast'] },
    { id: 'h2', name: 'Taj Mahal Palace', rating: 4.8, location: 'Mumbai, India', price: 22000, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000', amenities: ['Pool', 'Spa'] },
    { id: 'h3', name: 'Lemon Tree Premier', rating: 4.2, location: 'Mumbai, India', price: 6500, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=1000', amenities: ['Free Wifi', 'Gym'] },
];

const MOCK_BUSES = [
    { id: 'b1', operator: 'Orange Travels', type: 'A/C Sleeper (2+1)', time: '22:00 - 06:00', duration: '8h 00m', price: 1200, rating: 4.5, seats: 12 },
    { id: 'b2', operator: 'VRL Logistics', type: 'Volvo Multi-Axle A/C', time: '21:30 - 05:00', duration: '7h 30m', price: 1500, rating: 4.7, seats: 8 },
    { id: 'b3', operator: 'SRS Travels', type: 'Non A/C Seater', time: '20:00 - 05:00', duration: '9h 00m', price: 800, rating: 3.9, seats: 24 },
];

// --- Components ---

const SearchResults = ({ type, searchParams }: SearchResultsProps) => {
    const navigate = useNavigate();

    const handleBook = () => {
        // Correct Routing
        if (type === 'bus') {
             navigate('/booking/bus/seats'); 
        } else if (type === 'flight') {
             navigate('/booking/checkout'); // Simplified for now
        } else {
             navigate('/booking/checkout');
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 pb-20">
            {/* Filters / Header */}
            <div className="flex items-center justify-between py-6">
                <h2 className="text-xl font-bold text-gray-800">
                    {type === 'flight' && 'Available Flights'}
                    {type === 'hotel' && 'Recommended Hotels'}
                    {type === 'bus' && 'Available Buses'}
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full border-gray-200 text-gray-600 hover:bg-gray-50">Price: Low to High</Button>
                    <Button variant="outline" size="sm" className="rounded-full border-gray-200 text-gray-600 hover:bg-gray-50">Best Rated</Button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Flight Cards */}
                {type === 'flight' && MOCK_FLIGHTS.map((flight) => (
                    <div key={flight.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-4 w-full md:w-1/4">
                            <img src={flight.logo} alt={flight.airline} className="w-10 h-10 object-contain rounded-full bg-gray-50 p-1" />
                            <div>
                                <h3 className="font-bold text-gray-800">{flight.airline}</h3>
                                <p className="text-xs text-gray-500">{flight.code}</p>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-between w-full md:w-auto gap-8">
                             <div className="text-center">
                                <p className="text-lg font-bold text-gray-800">{flight.time.split('-')[0].trim()}</p>
                                <p className="text-xs text-gray-400">Delhi</p>
                             </div>
                             <div className="flex flex-col items-center">
                                <p className="text-xs text-gray-400 mb-1">{flight.duration}</p>
                                <div className="w-24 h-[1px] bg-gray-200 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-gray-300 bg-white" />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{flight.stops}</p>
                             </div>
                             <div className="text-center">
                                <p className="text-lg font-bold text-gray-800">{flight.time.split('-')[1].trim()}</p>
                                <p className="text-xs text-gray-400">Mumbai</p>
                             </div>
                        </div>
                        <div className="w-full md:w-auto flex items-center justify-between md:flex-col md:items-end gap-3 md:gap-1 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                            <p className="text-2xl font-bold text-gray-900">₹{flight.price.toLocaleString()}</p>
                            <Button onClick={handleBook} className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Book</Button>
                        </div>
                    </div>
                ))}

                {/* Hotel Cards */}
                {type === 'hotel' && MOCK_HOTELS.map((hotel) => (
                    <div key={hotel.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0">
                            <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-2">
                             <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{hotel.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {hotel.location}</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                                        <Star className="w-3 h-3 text-green-600 fill-current" />
                                        <span className="text-sm font-bold text-green-700">{hotel.rating}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    {hotel.amenities.map(am => (
                                        <span key={am} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">{am}</span>
                                    ))}
                                </div>
                             </div>
                             
                             <div className="flex items-end justify-between mt-6 md:mt-0">
                                <div>
                                    <p className="text-xs text-gray-400 line-through">₹{(hotel.price * 1.2).toLocaleString()}</p>
                                    <p className="text-2xl font-bold text-gray-900">₹{hotel.price.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">per night + taxes</p>
                                </div>
                                <Button onClick={handleBook} className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">View Room</Button>
                             </div>
                        </div>
                    </div>
                ))}

                {/* Bus Cards */}
                {type === 'bus' && MOCK_BUSES.map((bus) => (
                    <div key={bus.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col md:flex-row items-center gap-6">
                        <div className="w-full md:w-1/4">
                             <h3 className="font-bold text-gray-800 text-lg">{bus.operator}</h3>
                             <p className="text-sm text-gray-500 mt-1">{bus.type}</p>
                             <div className="flex items-center gap-1 mt-2">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs font-bold text-gray-700">{bus.rating}</span>
                                <span className="text-xs text-gray-400">(250 ratings)</span>
                             </div>
                        </div>

                         <div className="flex-1 flex items-center justify-between w-full md:w-auto gap-8">
                             <div className="text-center">
                                <p className="text-lg font-bold text-gray-800">{bus.time.split('-')[0].trim()}</p>
                                <p className="text-xs text-gray-400">Departure</p>
                             </div>
                             <div className="flex flex-col items-center">
                                <p className="text-xs text-gray-400 mb-1">{bus.duration}</p>
                                <div className="w-24 h-[1px] bg-gray-200 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center">
                                        <Bus className="w-3 h-3 text-gray-400" />
                                    </div>
                                </div>
                             </div>
                             <div className="text-center">
                                <p className="text-lg font-bold text-gray-800">{bus.time.split('-')[1].trim()}</p>
                                <p className="text-xs text-gray-400">Arrival</p>
                             </div>
                        </div>

                        <div className="w-full md:w-auto flex items-center justify-between md:flex-col md:items-end gap-3 md:gap-1 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                             <p className="text-2xl font-bold text-gray-900">₹{bus.price.toLocaleString()}</p>
                             <div className="text-right mb-2">
                                <p className="text-xs text-red-500 font-medium">{bus.seats} seats left</p>
                             </div>
                            <Button onClick={handleBook} className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Select Seats</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchResults;

import React, { useState, useRef, useEffect } from 'react';
import { Plane, Hotel, MapPin, ArrowRightLeft, Search, Bus, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { popularCities } from '@/data/suggestions';
import { useNavigate } from 'react-router-dom';

type TripType = 'oneWay' | 'roundTrip';

// --- Helper Components ---

interface CityDropdownProps {
    filterValue: string;
    onSelect: (city: string) => void;
}

const CityDropdown = ({ filterValue, onSelect }: CityDropdownProps) => {
    if (!filterValue) return null;

    const filtered = popularCities.filter(city => 
        city.toLowerCase().includes(filterValue.toLowerCase())
    ).slice(0, 8); // Show more results

    if (filtered.length === 0) return null;

    return (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto w-full">
            {filtered.map((city) => (
                <div
                    key={city}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(city);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 flex items-center gap-3 text-sm text-gray-700 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                >
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-3 h-3 text-gray-500" />
                    </div>
                    <span className="font-medium truncate">{city}</span>
                </div>
            ))}
        </div>
    );
};

interface InputFieldProps {
    label: string;
    icon: any;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder: string;
    onClear?: () => void;
    showDropdown?: boolean;
    onSelectCity?: (city: string) => void;
}

const InputField = ({ 
    label, 
    icon: Icon, 
    value, 
    onChange, 
    onFocus, 
    onBlur,
    placeholder, 
    onClear,
    showDropdown,
    onSelectCity
}: InputFieldProps) => (
    <div className="relative space-y-1 group w-full h-full">
        <Label className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider pl-1">{label}</Label>
        <div className="relative h-11 md:h-14">
            <div className="absolute left-3 top-3 md:left-4 md:top-3.5 pointer-events-none transition-colors group-focus-within:text-indigo-600 z-10">
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            </div>
            <Input
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder={placeholder}
                className="h-full pl-10 md:pl-12 pr-8 md:pr-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl md:rounded-2xl transition-all text-sm md:text-base font-medium shadow-sm hover:border-gray-300 w-full truncate"
            />
            {value && onClear && (
                <button 
                    onClick={onClear}
                    className="absolute right-2 top-3 md:right-3 md:top-3.5 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
                </button>
            )}
            
            {showDropdown && onSelectCity && (
                <CityDropdown filterValue={value} onSelect={onSelectCity} />
            )}
        </div>
    </div>
);

// --- Main Component ---

const BookingSearch = () => {
    const navigate = useNavigate();

    // Flight State
    const [tripType, setTripType] = useState<TripType>('oneWay');
    const [flightFrom, setFlightFrom] = useState('');
    const [flightTo, setFlightTo] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    
    // Hotel State
    const [destination, setDestination] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');

    // Bus State
    const [busFrom, setBusFrom] = useState('');
    const [busTo, setBusTo] = useState('');
    const [busDate, setBusDate] = useState('');

    // UI Helper State
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const handleFlightSwap = () => {
        const temp = flightFrom;
        setFlightFrom(flightTo);
        setFlightTo(temp);
    };

    const handleBusSwap = () => {
        const temp = busFrom;
        setBusFrom(busTo);
        setBusTo(temp);
    };

    const handleBusSearch = () => {
        navigate('/booking/bus', { state: { from: busFrom, to: busTo, date: busDate } });
    };

    // Styling helpers
    const tabTriggerClass = "h-full rounded-none border-b-[3px] border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-400 font-semibold text-sm md:text-lg px-2 pb-0 transition-all hover:text-indigo-500 data-[state=active]:bg-transparent";
    const tabIconClass = "w-4 h-4 md:w-5 md:h-5";

    return (
        <div className="w-full max-w-5xl mx-auto p-2 md:p-6 font-sans">
            <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-lg md:shadow-xl border border-gray-100 overflow-visible">
                <Tabs defaultValue="flight" className="w-full">
                    {/* Tabs Header */}
                    <div className="border-b border-gray-100">
                        <TabsList className="bg-transparent h-14 md:h-20 w-full justify-between md:justify-start p-0 px-4 md:px-8 gap-2 md:gap-10">
                            <TabsTrigger value="flight" className={tabTriggerClass}>
                                <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-4">
                                    <Plane className={tabIconClass} />
                                    <span>Flights</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger value="hotel" className={tabTriggerClass}>
                                <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-4">
                                    <Hotel className={tabIconClass} />
                                    <span>Hotels</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger value="bus" className={tabTriggerClass}>
                                <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-4">
                                    <Bus className={tabIconClass} />
                                    <span>Bus</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Flight Search */}
                    <TabsContent value="flight" className="p-4 md:p-8 space-y-3 md:space-y-6 focus-visible:outline-none">
                        
                        {/* Trip Type */}
                        <div className="inline-flex bg-gray-100 p-1 md:p-1.5 rounded-full">
                            <button onClick={() => setTripType('oneWay')} className={cn("px-3 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-200", tripType === 'oneWay' ? "bg-white text-indigo-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>One Way</button>
                            <button onClick={() => setTripType('roundTrip')} className={cn("px-3 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-200", tripType === 'roundTrip' ? "bg-white text-indigo-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>Round Trip</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 items-end">
                            
                            {/* Origin & Destination (Combined for layout) */}
                            <div className="lg:col-span-7 relative flex flex-col md:flex-row gap-2 md:gap-0">
                                <div className="w-full md:pr-1">
                                    <InputField 
                                        label="From" icon={Plane} value={flightFrom} onChange={(e) => setFlightFrom(e.target.value)}
                                        onFocus={() => setFocusedInput('flightFrom')} onBlur={() => setFocusedInput(null)} 
                                        placeholder="City / Airport" onClear={() => setFlightFrom('')}
                                        showDropdown={focusedInput === 'flightFrom'} onSelectCity={(city) => { setFlightFrom(city); setFocusedInput(null); }}
                                    />
                                </div>

                                {/* Absolute Centered Swap Button */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[15%] md:-translate-y-[10%] z-20">
                                    <button 
                                        onClick={handleFlightSwap}
                                        className="p-2 bg-white rounded-full text-indigo-600 hover:text-indigo-700 shadow-md border border-gray-100 transition-all hover:shadow-lg hover:scale-105 active:scale-95 group"
                                        title="Swap Locations"
                                    >
                                        <ArrowRightLeft className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180 rotate-90 md:rotate-0" />
                                    </button>
                                </div>

                                <div className="w-full md:pl-1">
                                    <InputField 
                                        label="To" icon={MapPin} value={flightTo} onChange={(e) => setFlightTo(e.target.value)}
                                        onFocus={() => setFocusedInput('flightTo')} onBlur={() => setFocusedInput(null)} 
                                        placeholder="City / Airport" onClear={() => setFlightTo('')}
                                        showDropdown={focusedInput === 'flightTo'} onSelectCity={(city) => { setFlightTo(city); setFocusedInput(null); }}
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider pl-1">Departure</Label>
                                    <div className="relative">
                                         <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="h-11 md:h-14 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl md:rounded-2xl cursor-pointer text-sm md:text-base font-medium" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                     <Label className={cn("text-[10px] md:text-xs font-bold uppercase tracking-wider pl-1", tripType === 'oneWay' ? "text-gray-300" : "text-gray-500")}>Return</Label>
                                     <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} disabled={tripType === 'oneWay'} className={cn("h-11 md:h-14 rounded-xl md:rounded-2xl transition-all cursor-pointer text-sm md:text-base font-medium", tripType === 'oneWay' ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500")} />
                                </div>
                            </div>

                            {/* Search Button */}
                            <div className="lg:col-span-2">
                                <Button disabled={!flightFrom || !flightTo || !departureDate} className="w-full h-11 md:h-14 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all font-bold text-sm md:text-base flex items-center justify-center gap-2">
                                    <Search className="w-4 h-4" /> Search
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Hotel Search */}
                    <TabsContent value="hotel" className="p-4 md:p-8 space-y-3 md:space-y-6 focus-visible:outline-none">
                         <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 items-end">
                            <div className="lg:col-span-5 relative z-40">
                                <InputField label="Destination" icon={Hotel} value={destination} onChange={(e) => setDestination(e.target.value)} onFocus={() => setFocusedInput('destination')} onBlur={() => setFocusedInput(null)} placeholder="City, Hotel, or Area" onClear={() => setDestination('')} showDropdown={focusedInput === 'destination'} onSelectCity={(city) => { setDestination(city); setFocusedInput(null); }} />
                            </div>
                            <div className="lg:col-span-4 grid grid-cols-2 gap-2 z-30">
                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider pl-1">Check In</Label>
                                    <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="h-11 md:h-14 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl md:rounded-2xl cursor-pointer text-sm md:text-base font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider pl-1">Check Out</Label>
                                    <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn} className="h-11 md:h-14 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl md:rounded-2xl cursor-pointer text-sm md:text-base font-medium" />
                                </div>
                            </div>
                            <div className="lg:col-span-3">
                                <Button disabled={!destination || !checkIn || !checkOut} className="w-full h-11 md:h-14 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all font-bold text-sm md:text-base flex items-center justify-center gap-2">
                                    <Search className="w-4 h-4" /> Search Hotels
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Bus Search */}
                    <TabsContent value="bus" className="p-4 md:p-8 space-y-3 md:space-y-6 focus-visible:outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 items-end">
                            
                            {/* Origin & Destination (Combined for layout) */}
                            <div className="lg:col-span-7 relative flex flex-col md:flex-row gap-2 md:gap-0">
                                <div className="w-full md:pr-1">
                                    <InputField 
                                        label="From" icon={Bus} value={busFrom} onChange={(e) => setBusFrom(e.target.value)}
                                        onFocus={() => setFocusedInput('busFrom')} onBlur={() => setFocusedInput(null)} 
                                        placeholder="City" onClear={() => setBusFrom('')}
                                        showDropdown={focusedInput === 'busFrom'} onSelectCity={(city) => { setBusFrom(city); setFocusedInput(null); }}
                                    />
                                </div>

                                {/* Absolute Centered Swap Button */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[15%] md:-translate-y-[10%] z-20">
                                    <button 
                                        onClick={handleBusSwap}
                                        className="p-2 bg-white rounded-full text-indigo-600 hover:text-indigo-700 shadow-md border border-gray-100 transition-all hover:shadow-lg hover:scale-105 active:scale-95 group"
                                        title="Swap Locations"
                                    >
                                        <ArrowRightLeft className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180 rotate-90 md:rotate-0" />
                                    </button>
                                </div>

                                <div className="w-full md:pl-1">
                                    <InputField 
                                        label="To" icon={MapPin} value={busTo} onChange={(e) => setBusTo(e.target.value)}
                                        onFocus={() => setFocusedInput('busTo')} onBlur={() => setFocusedInput(null)} 
                                        placeholder="City" onClear={() => setBusTo('')}
                                        showDropdown={focusedInput === 'busTo'} onSelectCity={(city) => { setBusTo(city); setFocusedInput(null); }}
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="lg:col-span-3">
                                 <Label className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider pl-1">Travel Date</Label>
                                 <Input type="date" value={busDate} onChange={(e) => setBusDate(e.target.value)} className="h-11 md:h-14 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl md:rounded-2xl cursor-pointer text-sm md:text-base font-medium" />
                            </div>

                            {/* Search Button */}
                            <div className="lg:col-span-2">
                                <Button disabled={!busFrom || !busTo || !busDate} onClick={handleBusSearch} className="w-full h-11 md:h-14 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all font-bold text-sm md:text-base flex items-center justify-center gap-2">
                                    <Search className="w-4 h-4" /> Search Bus
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default BookingSearch;

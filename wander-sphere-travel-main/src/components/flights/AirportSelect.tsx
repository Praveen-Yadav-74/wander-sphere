import { useState, useRef, useEffect } from 'react';
import { PlaneTakeoff, PlaneLanding, MapPin } from 'lucide-react';

const POPULAR_AIRPORTS = [
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj', city: 'Mumbai', country: 'India' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India' },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India' },
  { code: 'CCU', name: 'Netaji Subhas Chandra Bose', city: 'Kolkata', country: 'India' },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel', city: 'Ahmedabad', country: 'India' },
  { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India' },
  { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  icon: 'takeoff' | 'landing';
  error?: string;
}

export function AirportSelect({ value, onChange, label, placeholder, icon, error }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Find selected airport details
  const selectedAirport = POPULAR_AIRPORTS.find(a => a.code === value);
  const displayValue = selectedAirport 
    ? `${selectedAirport.city} (${selectedAirport.code})` 
    : value;

  // Filter airports based on search
  const filteredAirports = POPULAR_AIRPORTS.filter(airport => {
    const term = searchTerm.toLowerCase();
    return (
      airport.code.toLowerCase().includes(term) ||
      airport.city.toLowerCase().includes(term) ||
      airport.name.toLowerCase().includes(term) ||
      airport.country.toLowerCase().includes(term)
    );
  });

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      
      <div 
        className={`relative h-14 bg-white border ${
          error ? 'border-red-500' : isOpen ? 'border-[#0EA5E9] ring-2 ring-[#0EA5E9]/20' : 'border-[#E2E8F0]'
        } rounded-[10px] transition-all duration-200 cursor-text flex flex-col justify-center px-4 overflow-hidden group hover:border-[#0EA5E9]`}
        onClick={() => {
          setIsOpen(true);
          setSearchTerm('');
          setTimeout(() => document.getElementById(`search-${label}`)?.focus(), 50);
        }}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {icon === 'takeoff' ? (
            <PlaneTakeoff className={`w-5 h-5 ${isOpen || value ? 'text-[#0EA5E9]' : 'text-[#94A3B8]'}`} />
          ) : (
            <PlaneLanding className={`w-5 h-5 ${isOpen || value ? 'text-[#0EA5E9]' : 'text-[#94A3B8]'}`} />
          )}
        </div>
        
        <div className="pl-8">
          {isOpen ? (
            <input
              id={`search-${label}`}
              className="w-full bg-transparent outline-none text-[#0F172A] font-bold text-lg placeholder-[#94A3B8]"
              placeholder="City or Airport (e.g. DEL)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          ) : (
            <>
              {selectedAirport ? (
                <div className="flex flex-col">
                  <span className="text-[#0F172A] font-bold text-lg leading-tight truncate">
                    {selectedAirport.city}
                  </span>
                  <span className="text-[#64748B] text-xs font-medium truncate">
                    {selectedAirport.code} · {selectedAirport.name}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col justify-center h-full">
                  <span className={`font-bold text-lg ${value ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                    {value || placeholder || 'Select City'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {error && <p className="text-red-500 text-[11px] font-semibold mt-1.5 absolute">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 w-[320px] sm:w-[380px] top-[calc(100%+8px)] left-0 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#E2E8F0] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Top Airports</span>
            <span className="text-[10px] font-semibold text-[#94A3B8]">{filteredAirports.length} found</span>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto no-scrollbar">
            {filteredAirports.length > 0 ? (
              filteredAirports.map((airport) => (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => {
                    onChange(airport.code);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-[#F0F9FF] border-b border-[#F1F5F9] last:border-0 transition-colors flex items-center gap-3 group/item"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F8FAFC] group-hover/item:bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#64748B] group-hover/item:text-[#0EA5E9]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[#0F172A] font-bold truncate pr-3">{airport.city}</span>
                      <span className="text-[10px] font-black tracking-widest text-[#0EA5E9] bg-[#E0F2FE] border border-[#BAE6FD] px-2 py-0.5 rounded-full shrink-0">
                        {airport.code}
                      </span>
                    </div>
                    <span className="text-[#64748B] text-[11px] font-medium block truncate">
                      {airport.name}, {airport.country}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center bg-white">
                <PlaneTakeoff className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2 opacity-50" />
                <p className="text-[#64748B] text-sm font-semibold">No airports found</p>
                <p className="text-[#94A3B8] text-[11px] mt-1">Try searching by city name or 3-letter code</p>
                {/* Fallback to raw text if no match but it's 3 letters */}
                {searchTerm.length === 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(searchTerm.toUpperCase());
                      setIsOpen(false);
                    }}
                    className="mt-4 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg text-xs font-bold shadow-md hover:bg-[#0284C7]"
                  >
                    Use '{searchTerm.toUpperCase()}' Code
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

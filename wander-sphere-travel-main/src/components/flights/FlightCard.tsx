import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Briefcase, CheckCircle, Loader2, X } from 'lucide-react';
import type { FlightModel } from '@/types/flight';
import { Button } from '@/components/ui/button';

interface Props {
  flightGroup: FlightModel[];
  onSelect: (flight: FlightModel) => void;
  isReviewing: boolean;
}

import { parseEtravDate, formatTime, formatShortDate, formatDuration, formatPrice, computeDuration } from '@/utils/etravDate';

const AIRPORT_NAMES: Record<string, string> = {
  DEL: 'Indira Gandhi International',
  BOM: 'Chhatrapati Shivaji Maharaj International',
  BLR: 'Kempegowda International',
  MAA: 'Chennai International',
  CCU: 'Netaji Subhas Chandra Bose International',
  HYD: 'Rajiv Gandhi International',
  GOI: 'Goa International (Dabolim)',
  AMD: 'Sardar Vallabhbhai Patel International',
  PNQ: 'Pune Airport',
  COK: 'Cochin International'
};

export function FlightCard({ flightGroup, onSelect, isReviewing }: Props) {
  const [selectedFareIndex, setSelectedFareIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRoutePopup, setShowRoutePopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowRoutePopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeFlight = flightGroup[selectedFareIndex];
  if (!activeFlight) return null;
  
  // Segments is a flat array from eTrav (NOT array of arrays)
  const segs = activeFlight.Segments as any[];
  if (!segs || segs.length === 0) return null;

  const departure = segs[0];
  const arrival = segs[segs.length - 1];
  const stops = segs.length - 1;
  const additionalFaresCount = flightGroup.length - 1;
  
  // Price comes from Fares[0].FareDetails[0].TotalAmount (set by backend as Fare.TotalFare too)
  const totalFare = (activeFlight as any).Fare?.TotalFare || (activeFlight as any).Fares?.[0]?.FareDetails?.[0]?.TotalAmount || 0;
  const isFree = !totalFare || totalFare === 0;

  // Correct eTrav date fields: DepartureDateTime / ArrivalDateTime (ISO strings)
  const rawDepTime = departure.DepartureDateTime || departure.DepartureTime;
  const rawArrTime = arrival.ArrivalDateTime || arrival.ArrivalTime;

  const depTime = formatTime(rawDepTime);
  const arrTime = formatTime(rawArrTime);
  const depDate = formatShortDate(rawDepTime);

  // Duration: "HH:mm" from eTrav → format to "2h 05m"
  let duration = '';
  if (departure.Duration) {
    duration = formatDuration(departure.Duration);
  } else {
    const depD = parseEtravDate(rawDepTime);
    const arrD = parseEtravDate(rawArrTime);
    if (depD && arrD) {
      const mins = Math.round((arrD.getTime() - depD.getTime()) / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      duration = `${h}h ${m.toString().padStart(2, '0')}m`;
    }
  }

  const airlineName = departure.AirlineName || (activeFlight as any).AirlineName || departure.Airline || departure.AirlineCode || '';
  const flightNumber = departure.FlightNumber || '';
  const checkInBaggage = (activeFlight as any).Fares?.[0]?.FareDetails?.[0]?.CheckInBaggage || departure.Baggage || '15 Kg';
  const cabinBaggage = (activeFlight as any).Fares?.[0]?.FareDetails?.[0]?.CabinBaggage || departure.CabinBaggage || '7 Kg';

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Main Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">

          {/* Airline */}
          <div className="flex items-center gap-3 sm:w-44 shrink-0">
            <div className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center p-1.5 shrink-0">
              <img
                src={`https://pics.avs.io/60/60/${departure.AirlineCode}.png`}
                alt={departure.Airline}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = 'none';
                  t.parentElement!.innerHTML = `<span class="text-[10px] font-bold text-[#64748B]">${departure.AirlineCode}</span>`;
                }}
              />
            </div>
            <div>
              <p className="text-[#0F172A] font-semibold text-sm">{airlineName}</p>
              <p className="text-[#94A3B8] text-xs font-medium">{flightNumber}</p>
            </div>
          </div>

          {/* Itinerary */}
          <div className="flex-1 flex items-center justify-center gap-3 sm:gap-4">
            <div className="text-center">
              <p className="text-[#0F172A] font-bold text-xl sm:text-2xl leading-none">{depTime}</p>
              <p className="text-[#64748B] text-xs font-semibold mt-1 uppercase tracking-wider">{departure.Origin}</p>
              {depDate && <p className="text-[#94A3B8] text-[10px] font-medium mt-0.5">{depDate}</p>}
            </div>

            <div 
              onClick={() => setShowRoutePopup(true)}
              className="flex-1 flex flex-col items-center min-w-[60px] group cursor-pointer relative"
              title="View routing details"
            >
              {duration && <p className="text-[#94A3B8] text-[11px] font-medium mb-1.5 group-hover:text-[#0EA5E9] transition-colors">{duration}</p>}
              <div className="w-full flex items-center gap-1">
                <div className="flex-1 h-px bg-[#CBD5E1] group-hover:bg-[#0EA5E9] transition-colors" />
                <div className={`w-2 h-2 rounded-full transition-shadow group-hover:shadow-[0_0_8px_#0EA5E9] ${stops === 0 ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                <div className="flex-1 h-px bg-[#CBD5E1] group-hover:bg-[#0EA5E9] transition-colors" />
              </div>
              <p className={`text-[11px] font-bold mt-1.5 transition-colors group-hover:text-[#0EA5E9] ${stops === 0 ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                {stops === 0 ? 'Non-Stop' : `${stops} Stop${stops > 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="text-center">
              <p className="text-[#0F172A] font-bold text-xl sm:text-2xl leading-none">{arrTime}</p>
              <p className="text-[#64748B] text-xs font-semibold mt-1 uppercase tracking-wider">{arrival.Destination}</p>
            </div>
          </div>

          {/* Price + Button */}
          <div className="sm:w-40 shrink-0 flex flex-col items-center sm:items-end gap-2">
            <div className="text-center sm:text-right">
              <p className={`font-bold text-xl sm:text-2xl leading-none ${isFree ? 'text-[#64748B] text-base' : 'text-[#F59E0B]'}`}>
                {isFree ? 'Price on request' : formatPrice(totalFare)}
              </p>
              {!isFree && <p className="text-[#94A3B8] text-[10px] font-medium mt-0.5">per person</p>}
            </div>
            <Button
              onClick={() => onSelect(activeFlight)}
              disabled={isReviewing}
              className="w-full sm:w-auto bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold rounded-[10px] h-11 px-6 transition-all duration-200 hover:scale-[1.02] active:scale-95 border-0 text-sm"
            >
              {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select'}
            </Button>
          </div>
        </div>

        {/* Meta Row */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#F1F5F9] flex-wrap">
          <div className="flex items-center gap-1.5 text-[#64748B]">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">
                {checkInBaggage} Check-in
              </span>
          </div>
          {activeFlight.IsRefundable && (
            <div className="flex items-center gap-1.5 text-[#10B981]">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Refundable</span>
            </div>
          )}
          {activeFlight.FareClassification && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5E9] bg-[#E0F2FE] px-2 py-0.5 rounded-full">
              {activeFlight.FareClassification}
            </span>
          )}
        </div>
      </div>

      {/* Expandable Fares */}
      {additionalFaresCount > 0 && (
        <div className="border-t border-[#F1F5F9]">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[#0EA5E9] text-xs font-bold uppercase tracking-wider hover:bg-[#F0F9FF] transition-colors"
          >
            {isExpanded ? `Hide fare options` : `${additionalFaresCount} more fare${additionalFaresCount > 1 ? 's' : ''} available`}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isExpanded && (
            <div className="px-5 pb-5 bg-[#F8FAFC]">
              <table className="w-full text-left border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="py-2.5 pl-4 text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Fare Type</th>
                    <th className="py-2.5 px-2 text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Refund Policy</th>
                    <th className="py-2.5 pr-4 text-right text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {flightGroup.map((f, i) => {
                    const isSelected = selectedFareIndex === i;
                    return (
                      <tr key={f.ResultIndex} className={`cursor-pointer transition-colors ${isSelected ? 'bg-[#F0F9FF]' : 'hover:bg-[#F8FAFC]'}`} onClick={() => setSelectedFareIndex(i)}>
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#0EA5E9] bg-[#0EA5E9]' : 'border-[#CBD5E1]'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-[#0F172A] text-sm font-medium">{f.FareClassification || 'Standard'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`text-xs font-semibold ${f.IsRefundable ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
                            {f.IsRefundable ? 'Refundable' : 'Non-Refundable'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className={`text-sm font-bold ${isSelected ? 'text-[#F59E0B]' : 'text-[#0F172A]'}`}>
                            {f.Fare.TotalFare > 0 ? formatPrice(f.Fare.TotalFare) : 'On Request'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ROUTE POPUP OVERLAY */}
      {showRoutePopup && (
        <div className="fixed inset-0 z-40 bg-[#0F172A]/40 backdrop-blur-[2px] sm:hidden transition-all duration-300" onClick={() => setShowRoutePopup(false)} />
      )}

      {/* ROUTE POPUP MENU */}
      {showRoutePopup && (
        <div 
          ref={popupRef}
          className="fixed sm:absolute inset-x-0 bottom-0 sm:bottom-auto sm:top-[calc(100%+8px)] sm:left-1/2 sm:-translate-x-1/2 z-50 w-full sm:w-[440px] bg-white rounded-t-3xl sm:rounded-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.1)] sm:shadow-[0_12px_40px_rgba(15,23,42,0.12)] border border-[#E2E8F0] overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-top-4 fade-in duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F0F9FF] to-white">
            <div>
              <h3 className="text-[#0F172A] font-bold text-lg flex items-center gap-2">
                {departure.Origin} {'→'} {arrival.Destination}
              </h3>
              <p className="text-[#64748B] text-[13px] font-semibold mt-0.5">
                {airlineName} {'·'} {flightNumber} {'·'} {departure.CabinClass || 'Economy'}
              </p>
            </div>
            <button 
              onClick={() => setShowRoutePopup(false)}
              className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
            {segs.map((seg: any, idx: number) => {
              const sDep = seg.DepartureDateTime || seg.DepartureTime;
              const sArr = seg.ArrivalDateTime || seg.ArrivalTime;
              let layover = '';
              if (idx > 0) {
                const prevArr = segs[idx - 1].ArrivalDateTime || segs[idx - 1].ArrivalTime;
                const depD = parseEtravDate(sDep);
                const prevD = parseEtravDate(prevArr);
                if (depD && prevD) {
                  const lMins = Math.round((depD.getTime() - prevD.getTime()) / 60000);
                  if (lMins > 0) layover = `${Math.floor(lMins / 60)}h ${(lMins % 60).toString().padStart(2, '0')}m`;
                }
              }
              const sOrigin = typeof seg.Origin === 'object' ? (seg.Origin?.AirportCode || '') : (seg.Origin || '');
              const sDest = typeof seg.Destination === 'object' ? (seg.Destination?.AirportCode || '') : (seg.Destination || '');

              return (
                <div key={idx} className="relative">
                  {idx > 0 && (
                    <div className="flex flex-col items-start py-2 relative pl-1.5 sm:pl-2">
                      <div className="absolute left-[9px] sm:left-2.5 top-0 bottom-0 w-px border-l-2 border-dashed border-[#CBD5E1]" />
                      <div className="bg-[#FFFBEB] border border-[#FCD34D] text-[#D97706] text-[10px] font-bold px-2.5 py-0.5 rounded-full z-10 ml-8 flex items-center gap-1 shadow-sm">
                        Layover: {layover}
                      </div>
                    </div>
                  )}
                  
                  {/* Segment block */}
                  <div className="flex gap-4 relative">
                    {/* Timeline graphic */}
                    <div className="flex flex-col items-center mt-1.5 w-5 shrink-0">
                      <div className="w-3 h-3 rounded-full bg-[#0EA5E9] shadow-[0_0_0_3px_rgba(14,165,233,0.15)] z-10" />
                      <div className="w-px flex-1 bg-[#E2E8F0] my-1" />
                      <div className="w-3 h-3 rounded-full border-[2.5px] border-[#0EA5E9] bg-white z-10" />
                    </div>
                    
                    <div className="flex-1 pb-2">
                      {/* Origin */}
                      <div className="mb-3">
                        <p className="text-[#0F172A] font-bold text-[15px] flex items-center flex-wrap gap-1.5">
                          {sOrigin} 
                          <span className="font-medium text-[#64748B] text-[13px] truncate">
                            {AIRPORT_NAMES[sOrigin] || sOrigin}
                          </span>
                        </p>
                        <p className="text-[#64748B] text-xs font-semibold mt-0.5">
                          Dep: <span className="text-[#0F172A] ml-0.5">{formatTime(sDep)}</span> {'·'} {formatShortDate(sDep)}
                        </p>
                      </div>
                      
                      {/* Duration line */}
                      <div className="py-3 border-y border-[#F1F5F9] my-2 text-xs font-semibold text-[#64748B] flex items-center gap-2">
                        <span>Duration: {seg.Duration ? formatDuration(seg.Duration) : computeDuration(sDep, sArr)}</span>
                        {idx > 0 && <span className="text-[#94A3B8] font-medium">({seg.AirlineCode}-{seg.FlightNumber})</span>}
                      </div>

                      {/* Destination */}
                      <div className="mt-3">
                        <p className="text-[#0F172A] font-bold text-[15px] flex items-center flex-wrap gap-1.5">
                          {sDest} 
                          <span className="font-medium text-[#64748B] text-[13px] truncate">
                            {AIRPORT_NAMES[sDest] || sDest}
                          </span>
                        </p>
                        <p className="text-[#64748B] text-xs font-semibold mt-0.5">
                          Arr: <span className="text-[#0F172A] ml-0.5">{formatTime(sArr)}</span> {'·'} {formatShortDate(sArr)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Tags */}
            <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex flex-wrap gap-2.5">
              <span className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                {checkInBaggage} Check-in
              </span>
              <span className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                {cabinBaggage} Cabin
              </span>
              <span className="bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                {stops === 0 ? 'Non-Stop' : `${stops} Stop${stops > 1 ? 's' : ''}`}
              </span>
              <span className="bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                {departure.CabinClass || 'Economy'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

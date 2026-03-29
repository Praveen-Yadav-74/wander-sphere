/**
 * Flights.tsx - Complete Flight Booking Flow
 * Routes: /flights/search -> /results -> /review -> /passengers -> /seats -> /payment -> /confirmation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  Plane, Clock, AlertCircle, ArrowRight, Calendar, Users, Edit2,
  Check, ChevronRight, Shield, XCircle, ChevronDown, ChevronUp, Lock,
  RefreshCw, Briefcase, Ban, Info
} from 'lucide-react';
import { parseEtravDate, formatTime, formatShortDate, formatFullDate, computeDuration, formatPrice } from '@/utils/etravDate';
import { useFlightBooking, FlightBookingProvider } from '@/hooks/useFlightBooking';
import { FlightSearchForm } from '@/components/flights/FlightSearchForm';
import { FlightResultsList } from '@/components/flights/FlightResultsList';
import { FareChangeAlert } from '@/components/flights/FareChangeAlert';
import { PassengerForm } from '@/components/flights/PassengerForm';
import { SeatMap } from '@/components/flights/SeatMap';
import { BookingConfirmation } from '@/components/flights/BookingConfirmation';
import { CancellationModal } from '@/components/flights/CancellationModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { PassengerInput, FlightSearchParams, FareRule, FlightModel } from '@/types/flight';
import { toast } from 'sonner';
import { apiRequest } from '@/utils/api';
import { apiConfig } from '@/config/api';
import type { SearchFormValues } from '@/lib/schemas/flightSchemas';

/** eTrav: Segments may be flat [seg, ...] or nested [[seg, ...], ...]. Returns first journey's segment row. */
function normalizeLegSegmentList(rawSegs: unknown): any[] {
  const segsArray = Array.isArray(rawSegs)
    ? rawSegs
    : (rawSegs && typeof rawSegs === 'object' ? [rawSegs] : []);
  if (segsArray.length === 0) return [];
  const first = segsArray[0] as Record<string, unknown> | unknown[];
  if (Array.isArray(first)) return first as any[];
  const looksLikeSegment = (o: unknown) =>
    Boolean(o && typeof o === 'object' && ('Origin' in (o as object) || 'FlightNumber' in (o as object)));
  if (looksLikeSegment(first)) return segsArray as any[];
  return [first] as any[];
}

function segmentDepartureTime(seg: { DepartureDateTime?: unknown; DepartureTime?: unknown } | null | undefined) {
  return seg?.DepartureDateTime ?? seg?.DepartureTime;
}

function segmentArrivalTime(seg: { ArrivalDateTime?: unknown; ArrivalTime?: unknown } | null | undefined) {
  return seg?.ArrivalDateTime ?? seg?.ArrivalTime;
}

function fareDisplayFromFlight(sf: FlightModel | null): { baseFare: number; tax: number; totalFare: number } {
  if (!sf) return { baseFare: 0, tax: 0, totalFare: 0 };
  const anyF = sf as any;
  const fd = anyF.Fares?.[0]?.FareDetails?.[0];
  const baseFare = Number(sf.Fare?.BaseFare) || Number(fd?.BaseFare) || 0;
  const tax = Number(sf.Fare?.Tax) || Number(fd?.Tax) || 0;
  const totalFare =
    Number(sf.Fare?.TotalFare) ||
    Number(fd?.TotalAmount) ||
    Number(fd?.TotalFare) ||
    0;
  return { baseFare, tax, totalFare };
}

// ─── Structured Fare Policy Accordions (BUG 4) ──────────────────────────
interface PolicySection { icon: React.ReactNode; title: string; content: string; }

function PolicyAccordion({ section, defaultOpen }: { section: PolicySection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className={`rounded-xl overflow-hidden border transition-all ${open ? 'border-[#0EA5E9] border-l-4 border-l-[#0EA5E9]' : 'border-[#E2E8F0]'}`}>
      <button
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-[#F0F9FF] transition-colors bg-[#F8FAFC]"
        onClick={() => setOpen(!open)}
      >
        <span className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
          {section.icon} {section.title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-[#0EA5E9]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-white">
          <p className="text-[#64748B] text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
        </div>
      )}
    </div>
  );
}

function buildPolicySections(fareRules: FareRule[], flight: FlightModel | null): PolicySection[] {
  const rule = fareRules[0];
  const segs = normalizeLegSegmentList(flight?.Segments);
  const seg = segs[0] as any;
  const baggage = seg?.Baggage || seg?.CheckInBaggage || seg?.Free_Baggage?.Check_In_Baggage || '15 KG';
  const cabin = seg?.CabinBaggage || seg?.Free_Baggage?.Hand_Baggage || '7 KG';
  const airline = rule?.Airline || seg?.AirlineCode || '';
  const isRefundable = flight?.IsRefundable;

  const cancellationText = rule?.FareRuleDetail
    ? rule.FareRuleDetail.slice(0, 400)
    : 'Cancellation charges apply. Please check with the airline for exact fees.';

  const dateChangeText = rule?.FareRestriction
    ? rule.FareRestriction.slice(0, 400)
    : 'Date change charges apply. Contact airline for rescheduling fee details.';

  return [
    { icon: <AlertCircle className="w-4 h-4 text-blue-500" />, title: 'Cancellation Policy', content: cancellationText },
    { icon: <RefreshCw className="w-4 h-4 text-orange-500" />, title: 'Date Change / Reschedule', content: dateChangeText },
    { icon: <Briefcase className="w-4 h-4 text-green-500" />, title: 'Baggage Allowance', content: `${baggage} Check-in | ${cabin} Cabin` },
    { icon: <Ban className="w-4 h-4 text-red-500" />, title: 'No Show Policy', content: 'No-show penalty applies. Contact airline for details before missing your flight.' },
    { icon: <Info className="w-4 h-4 text-gray-500" />, title: 'General Info', content: `Airline: ${airline}\nFare class: ${flight?.FareClassification || 'Standard'}\nRefundable: ${isRefundable ? 'Yes' : 'No, non-refundable fare'}` },
  ];
}

// --- Hold Timer ---
function HoldTimer({ expiresAt, onExpire }: { expiresAt: Date; onExpire?: () => void }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    let hasExpired = false;
    const tick = () => {
      const ms = expiresAt.getTime() - Date.now();
      if (ms <= 0) {
        setRemaining('Expired');
        if (!hasExpired) { hasExpired = true; onExpire?.(); }
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  const isUrgent = expiresAt.getTime() - Date.now() < 2 * 60 * 1000;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
      isUrgent ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
    }`}>
      <Clock className="h-3.5 w-3.5" />
      Seat held: {remaining}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// --- Step Progress Bar ---
const STEPS = ['Search', 'Results', 'Review', 'Passengers', 'Payment'];

function StepBar() {
  const location = useLocation();
  const path = location.pathname;
  let current = 0;
  if (path.includes('/results')) current = 1;
  else if (path.includes('/review')) current = 2;
  else if (path.includes('/passengers')) current = 3;
  else if (path.includes('/seats')) current = 3;
  else if (path.includes('/payment')) current = 4;
  else if (path.includes('/confirmation')) current = 5;

  return (
    <div className="bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {STEPS.map((label, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <div key={label} className="flex items-center gap-1 shrink-0">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  done ? 'bg-[#E0F2FE] text-[#0284C7]' : active ? 'bg-[#0EA5E9] text-white shadow-sm shadow-[#0EA5E9]/30' : 'bg-[#F1F5F9] text-[#94A3B8]'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    done ? 'bg-[#0EA5E9] text-white' : active ? 'bg-white text-[#0EA5E9]' : 'bg-[#CBD5E1] text-white'
                  }`}>
                    {done ? <Check strokeWidth={3} className="w-3 h-3" /> : i + 1}
                  </div>
                  {label}
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${done ? 'text-[#0EA5E9]' : 'text-[#CBD5E1]'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Skeleton cards while searching ---
function SearchingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:w-44">
              <div className="w-10 h-10 rounded-xl bg-[#E2E8F0]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-[#E2E8F0] rounded w-28" />
                <div className="h-2.5 bg-[#F1F5F9] rounded w-16" />
              </div>
            </div>
            <div className="flex-1 flex items-center gap-4">
              <div className="space-y-1.5 text-center">
                <div className="h-6 bg-[#E2E8F0] rounded w-14 mx-auto" />
                <div className="h-2.5 bg-[#F1F5F9] rounded w-8 mx-auto" />
              </div>
              <div className="flex-1 flex flex-col items-center gap-1.5">
                <div className="h-2.5 bg-[#F1F5F9] rounded w-14" />
                <div className="w-full h-px bg-[#E2E8F0]" />
                <div className="h-2.5 bg-[#F1F5F9] rounded w-12" />
              </div>
              <div className="space-y-1.5 text-center">
                <div className="h-6 bg-[#E2E8F0] rounded w-14 mx-auto" />
                <div className="h-2.5 bg-[#F1F5F9] rounded w-8 mx-auto" />
              </div>
            </div>
            <div className="sm:w-40 space-y-2">
              <div className="h-6 bg-[#FEF3C7] rounded w-24 ml-auto" />
              <div className="h-11 bg-[#E0F2FE] rounded-[10px] w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Session guard ---
function RequireSession({ children }: { children: React.ReactNode }) {
  const { state } = useFlightBooking();
  if (!state.searchParams) {
    return <Navigate to="/flights/search" replace />;
  }
  return <>{children}</>;
}

// --- Shared back + trip info header ---
function TopHeaderInfo() {
  const { state } = useFlightBooking();
  const navigate = useNavigate();

  if (!state.searchParams) return null;
  const totalPax = state.searchParams.Adults + state.searchParams.Children + state.searchParams.Infants;

  const handleBack = () => navigate(-1);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <button onClick={handleBack} className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] transition-colors text-sm font-medium">
          {`\u2190`} Back
        </button>
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[#64748B] text-sm font-medium">
        <span className="font-bold text-[#0F172A]">{state.searchParams.Origin}</span>
        <ArrowRight className="w-4 h-4 text-[#0EA5E9]" />
        <span className="font-bold text-[#0F172A]">{state.searchParams.Destination}</span>
        <span className="text-[#CBD5E1]">{'\u00B7'}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#0EA5E9]" />{state.searchParams.DepartureDate}</span>
        <span className="text-[#CBD5E1]">{'\u00B7'}</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-[#0EA5E9]" />{totalPax} pax</span>
      </div>
    </div>
  );
}

// --- Compact modifiable search bar (results page) ---
function CompactSearchBar({ onModify }: { onModify: () => void }) {
  const { state } = useFlightBooking();
  if (!state.searchParams) return null;
  const p = state.searchParams;
  const totalPax = p.Adults + p.Children + p.Infants;
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_8px_rgba(0,0,0,0.06)] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
      <div className="flex items-center flex-wrap gap-2 text-sm font-medium text-[#0F172A]">
        <span className="font-bold">{p.Origin}</span>
        <ArrowRight className="w-4 h-4 text-[#0EA5E9]" />
        <span className="font-bold">{p.Destination}</span>
        <span className="text-[#CBD5E1]">|</span>
        <span className="text-[#64748B]">{p.DepartureDate}</span>
        <span className="text-[#CBD5E1]">|</span>
        <span className="text-[#64748B]">{totalPax} Adult{totalPax !== 1 ? 's' : ''}</span>
        <span className="text-[#CBD5E1]">|</span>
        <span className="text-[#64748B]">{p.CabinClass}</span>
      </div>
      <button
        onClick={onModify}
        className="flex items-center gap-1.5 text-[#0EA5E9] font-bold text-sm border border-[#0EA5E9] rounded-full px-4 py-1.5 hover:bg-[#E0F2FE] transition-colors whitespace-nowrap"
      >
        <Edit2 className="w-3.5 h-3.5" /> Modify
      </button>
    </div>
  );
}

// ROUTE PAGES

// --- STEP 1: /flights/search ---
function RouteSearch() {
  const navigate = useNavigate();
  const { triggerSearch, isSearching, state, error } = useFlightBooking();

  const handleSearch = useCallback((values: SearchFormValues) => {
    triggerSearch({
      Origin: String(values.Origin ?? '').toUpperCase(),
      Destination: String(values.Destination ?? '').toUpperCase(),
      DepartureDate: values.DepartureDate ?? '',
      ReturnDate: values.ReturnDate || undefined,
      Adults: values.Adults ?? 1,
      Children: values.Children ?? 0,
      Infants: values.Infants ?? 0,
      CabinClass: values.CabinClass ?? 'Economy',
      JourneyType: values.JourneyType ?? 'OneWay',
      DirectFlight: values.DirectFlight ?? false,
    });
  }, [triggerSearch]);

  // Navigate to results once search completes
  useEffect(() => {
    if (state.step === 'RESULTS') {
      navigate('/flights/results', { replace: false });
    }
    if (state.step === 'ERROR' && error) {
      toast.error(error);
    }
  }, [state.step, navigate, error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <FlightSearchForm onSearch={handleSearch} isLoading={isSearching} />
    </div>
  );
}

// --- STEP 2: /flights/results ---
function RouteResults() {
  const { state, triggerSearch, selectFlight, isSearching, isReviewing, error } = useFlightBooking();
  const navigate = useNavigate();
  const [showModify, setShowModify] = useState(false);

  const totalPax = state.searchParams
    ? state.searchParams.Adults + state.searchParams.Children + state.searchParams.Infants
    : 1;

  // Re-search handler from collapsed bar
  const handleReSearch = useCallback((values: SearchFormValues) => {
    triggerSearch({
      Origin: String(values.Origin ?? '').toUpperCase(),
      Destination: String(values.Destination ?? '').toUpperCase(),
      DepartureDate: values.DepartureDate ?? '',
      ReturnDate: values.ReturnDate || undefined,
      Adults: values.Adults ?? 1,
      Children: values.Children ?? 0,
      Infants: values.Infants ?? 0,
      CabinClass: values.CabinClass ?? 'Economy',
      JourneyType: values.JourneyType ?? 'OneWay',
      DirectFlight: values.DirectFlight ?? false,
    });
    setShowModify(false);
  }, [triggerSearch]);

  // After re-search, results flow back to same page (state.step becomes RESULTS)
  useEffect(() => {
    if (state.step === 'ERROR' && error) {
      toast.error(error);
    }
  }, [state.step, error]);

  if (state.step === 'ERROR' && error && !isSearching) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 flex items-center gap-5">
          <div className="w-12 h-12 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-red-500 font-bold text-xs uppercase tracking-wider mb-1">Search Error</p>
            <p className="text-[#0F172A] font-bold text-lg">{error}</p>
            <p className="text-[#64748B] text-sm mt-1">Taking longer than usual. Tap to retry.</p>
          </div>
          <Button onClick={() => state.searchParams && triggerSearch(state.searchParams)} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-[10px] h-10 px-5 font-semibold border-0 text-sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-5">
      {/* Compact modifiable search bar */}
      {!showModify && <CompactSearchBar onModify={() => setShowModify(true)} />}

      {/* Expanded modify form */}
      {showModify && (
        <div className="mb-5">
          <FlightSearchForm
            onSearch={handleReSearch}
            isLoading={isSearching}
          />
          <button
            onClick={() => setShowModify(false)}
            className="mt-3 text-[#64748B] text-sm font-semibold hover:text-[#0EA5E9] transition-colors"
          >
            {'X'} Cancel
          </button>
        </div>
      )}

      {isSearching ? (
        <div className="mt-4">
          <p className="text-[#64748B] font-semibold text-sm mb-4 text-center">
            Searching across hundreds of airlines for the best fares...
          </p>
          <SearchingSkeleton />
        </div>
      ) : state.searchResults.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="w-16 h-16 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center mx-auto mb-4">
            <Plane className="w-7 h-7 text-[#0EA5E9]" />
          </div>
          <h3 className="text-[#0F172A] font-bold text-xl mb-1">No flights found</h3>
          <p className="text-[#64748B] text-sm font-medium">Try different dates or nearby airports.</p>
          <Button onClick={() => setShowModify(true)} className="mt-5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-[10px] h-10 px-5 font-semibold border-0 text-sm">
            Modify Search
          </Button>
        </div>
      ) : (
        <FlightResultsList
          flights={state.searchResults}
          onSelect={(flight) => {
            selectFlight(flight);
            navigate('/flights/review');
          }}
          isReviewing={isReviewing}
          totalPax={totalPax}
        />
      )}
    </div>
  );
}

// --- STEP 3: /flights/review ---
function RouteReview() {
  const { state, acceptFareChange, isReviewing, error } = useFlightBooking();
  const navigate = useNavigate();

  if (state.step === 'ERROR' && error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 flex items-center gap-5">
          <div className="w-12 h-12 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-red-500 font-bold text-xs uppercase tracking-wider mb-1">Review Error</p>
            <p className="text-[#0F172A] font-bold text-lg">{error}</p>
          </div>
          <Button onClick={() => navigate(-1)} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-[10px] h-10 px-5 font-semibold border-0 text-sm">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-5">
      <TopHeaderInfo />

      {isReviewing ? (
        <div className="text-center py-24 space-y-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-[#0EA5E9]/20 animate-ping" />
            <div className="w-16 h-16 bg-[#E0F2FE] rounded-full flex items-center justify-center border border-[#BAE6FD]">
              <Plane className="w-7 h-7 text-[#0EA5E9] animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-[#0F172A] font-bold text-xl">Checking latest prices...</p>
            <p className="text-[#64748B] text-sm font-medium mt-1">Securing the latest fare for your journey...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Fare change alert */}
          {state.fareChanged && state.repriceResult && (
            <FareChangeAlert
              open={true}
              repriceResult={state.repriceResult}
              originalFare={state.originalFare ?? 0}
              onAccept={acceptFareChange}
              onReject={() => navigate(-1)}
            />
          )}

          {/* Flight mini summary */}
          {state.selectedFlight && (() => {
            const sf = state.selectedFlight;
            const segs = normalizeLegSegmentList(sf.Segments);
            const { baseFare: fb, tax: tx, totalFare: tf } = fareDisplayFromFlight(sf);
            const firstSeg = segs[0];
            const lastSeg = segs[segs.length - 1];
            const depRaw = firstSeg ? segmentDepartureTime(firstSeg) : '';
            const arrRaw = lastSeg ? segmentArrivalTime(lastSeg) : '';
            const depDate = depRaw ? formatFullDate(String(depRaw)) : '';
            const flightDur = firstSeg ? computeDuration(segmentDepartureTime(firstSeg) as string | undefined, segmentArrivalTime(lastSeg) as string | undefined) : '';
            return (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
                <h3 className="text-[#0F172A] font-bold mb-3 flex items-center gap-2 text-sm">
                  <Plane className="w-4 h-4 text-[#0EA5E9]" /> Flight Details
                </h3>
                {depDate && <p className="text-[#64748B] text-xs font-medium mb-3">{depDate}</p>}
                {segs.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] mb-2 last:mb-0">
                    <div>
                      <p className="text-[#0F172A] font-bold">{seg.Origin}</p>
                      <p className="text-[#64748B] text-xs font-medium">{formatTime(segmentDepartureTime(seg))}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-[#0EA5E9] font-bold text-[10px] bg-[#E0F2FE] border border-[#BAE6FD] px-2 py-0.5 rounded-full">
                        {seg.AirlineCode}-{seg.FlightNumber}
                      </span>
                      {flightDur && i === 0 && <p className="text-[#94A3B8] text-[10px] mt-1">{flightDur}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-[#0F172A] font-bold">{seg.Destination}</p>
                      <p className="text-[#64748B] text-xs font-medium">{formatTime(segmentArrivalTime(seg))}</p>
                    </div>
                  </div>
                ))}
                {/* Fare Breakdown */}
                <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
                  <h4 className="text-[#0F172A] font-bold text-sm mb-2">Fare Breakdown</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#64748B] font-medium text-[13px]">Base Fare:</span>
                    <span className="text-[#0F172A] font-medium text-[13px]">
                      {fb > 0 ? `\u20B9${fb.toLocaleString('en-IN')}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#64748B] font-medium text-[13px]">Taxes & Fees:</span>
                    <span className="text-[#0F172A] font-medium text-[13px]">
                      {tx > 0 ? `\u20B9${tx.toLocaleString('en-IN')}` : '-'}
                    </span>
                  </div>
                  <div className="h-px bg-[#E2E8F0] my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-[#0F172A] font-bold">Subtotal:</span>
                    <span className="text-[#F59E0B] font-black text-2xl">
                      {tf > 0 ? `\u20B9${tf.toLocaleString('en-IN')}` : 'Price on request'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Cancellation Protection - BUG 8 */}
          <CancellationProtectionCard />

          {/* Fare Rules - BUG 4: structured accordions */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#0EA5E9]" />
              <h3 className="text-[#0F172A] font-bold text-sm">Fare Rules & Policies</h3>
            </div>
            <div className="p-5 space-y-2">
              {buildPolicySections(state.fareRules ?? [], state.selectedFlight).map((s, idx) => (
                <PolicyAccordion key={s.title} section={s} defaultOpen={idx === 0} />
              ))}
              <div className="pt-4 border-t border-[#F1F5F9] flex justify-end">
                <Button
                  onClick={() => navigate('/flights/passengers')}
                  className="h-12 px-8 rounded-[10px] bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold shadow-md shadow-[#0EA5E9]/25 hover:scale-[1.01] transition-all border-0 text-sm"
                >
                  Continue to Passenger Details {'\u2192'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Cancellation Protection Card (BUG 8) ---
function CancellationProtectionCard() {
  const [selected, setSelected] = useState<'none' | 'protected'>('none');
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
      <h3 className="text-[#0F172A] font-bold mb-3 flex items-center gap-2 text-sm">
        <Shield className="w-4 h-4 text-[#0EA5E9]" /> Cancellation Protection
      </h3>
      <div className="space-y-3">
        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
          selected === 'protected' ? 'border-[#0EA5E9] bg-[#F0F9FF]' : 'border-[#E2E8F0] hover:border-[#BAE6FD]'
        }`}>
          <input type="radio" name="cancel_prot" value="protected" checked={selected === 'protected'}
            onChange={() => setSelected('protected')} className="mt-1 accent-[#0EA5E9]" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-[#0F172A] text-sm flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" /> Free Cancellation</span>
              <span className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-black px-2 py-0.5 rounded-full">+{'\u20B9'}299</span>
            </div>
            <p className="text-[#64748B] text-xs">Cancel anytime before departure &amp; get a full refund of base fare.</p>
          </div>
        </label>
        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
          selected === 'none' ? 'border-[#0EA5E9] bg-[#F0F9FF]' : 'border-[#E2E8F0] hover:border-[#BAE6FD]'
        }`}>
          <input type="radio" name="cancel_prot" value="none" checked={selected === 'none'}
            onChange={() => setSelected('none')} className="mt-1 accent-[#0EA5E9]" />
          <div className="flex-1">
            <p className="font-bold text-[#0F172A] text-sm mb-1">No Protection <span className="text-[#94A3B8] font-normal">(Default)</span></p>
            <p className="text-[#64748B] text-xs">Standard airline cancellation charges apply.</p>
          </div>
        </label>
      </div>
    </div>
  );
}

// --- STEP 4: /flights/passengers ---
function RoutePassengers() {
  const navigate = useNavigate();
  const { state, loadSSRAndSeatMap, isLoadingSSR, setPassengers, holdBooking, isHolding, error } = useFlightBooking();
  const [collectedPassengers, setCollectedPassengers] = useState<PassengerInput[]>([]);
  const [currentPaxIndex, setCurrentPaxIndex] = useState(0);

  useEffect(() => {
    if (state.selectedFlight && !state.ssrOptions && !isLoadingSSR) {
      loadSSRAndSeatMap(state.selectedFlight.ResultIndex, state.selectedFlight.TraceId);
    }
  }, [state.selectedFlight, state.ssrOptions, isLoadingSSR, loadSSRAndSeatMap]);

  // Navigate to payment after holdBooking succeeds (step becomes PAYMENT)
  useEffect(() => {
    if (state.step === 'PAYMENT' && state.tempBooking) {
      navigate('/flights/payment', { replace: false });
    }
    if (state.step === 'ERROR' && error) {
      toast.error(error || 'Booking failed. Please try again.');
    }
  }, [state.step, state.tempBooking, navigate, error]);

  if (!state.searchParams) return null;

  const paxList: Array<{ type: 'Adult' | 'Child' | 'Infant'; index: number }> = [];
  for (let i = 0; i < state.searchParams.Adults; i++)   paxList.push({ type: 'Adult',  index: i });
  for (let i = 0; i < state.searchParams.Children; i++) paxList.push({ type: 'Child',  index: i });
  for (let i = 0; i < state.searchParams.Infants; i++)  paxList.push({ type: 'Infant', index: i });

  const handlePassengerSubmit = (data: PassengerInput) => {
    const updated = [...collectedPassengers, data];
    setCollectedPassengers(updated);

    if (currentPaxIndex < paxList.length - 1) {
      setCurrentPaxIndex((i) => i + 1);
    } else {
      // All passengers collected - save them and trigger TempBooking
      setPassengers(updated);
      if (state.selectedFlight) {
        if (state.seatMap && state.seatMap.length > 0) {
          // Go to seats first, then holdBooking happens after seat selection
          navigate('/flights/seats');
        } else {
          // No seat map → skip seats, call holdBooking directly
          holdBooking({
            ResultIndex: state.selectedFlight.ResultIndex,
            TraceId: state.selectedFlight.TraceId,
            Passengers: updated,
            FareAmount: state.selectedFlight.Fare.TotalFare,
          });
          // Navigation to /flights/payment will happen in useEffect above
        }
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5">
      <TopHeaderInfo />

      {/* Holding overlay */}
      {isHolding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-xs mx-4">
            <div className="w-16 h-16 bg-[#E0F2FE] rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-[#0EA5E9] animate-bounce" />
            </div>
            <p className="text-[#0F172A] font-bold text-lg">Securing your booking...</p>
            <p className="text-[#64748B] text-sm mt-2">Please wait while we hold your seat.</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-[#0F172A] font-bold text-xl">Passenger Details</h2>
            <p className="text-[#64748B] text-sm font-medium mt-0.5">
              Passenger {currentPaxIndex + 1} of {paxList.length}
            </p>
          </div>
          <div className="flex gap-1.5">
            {paxList.map((_, i) => (
              <div key={i} className={`transition-all duration-200 rounded-full ${
                i < currentPaxIndex ? 'w-5 h-5 bg-[#10B981] border-2 border-[#10B981] flex items-center justify-center'
                : i === currentPaxIndex ? 'w-6 h-6 bg-[#0EA5E9] border-2 border-[#0EA5E9] flex items-center justify-center'
                : 'w-4 h-4 bg-[#E2E8F0] border-2 border-[#CBD5E1]'
              }`}>
                {i < currentPaxIndex && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                {i === currentPaxIndex && <span className="text-white text-[9px] font-black">{i + 1}</span>}
              </div>
            ))}
          </div>
        </div>

        {paxList[currentPaxIndex] && (
          <PassengerForm
            paxIndex={currentPaxIndex}
            paxType={paxList[currentPaxIndex].type}
            travelDate={state.searchParams?.DepartureDate ?? ''}
            ssrOptions={state.ssrOptions}
            onSubmit={handlePassengerSubmit}
            isLast={currentPaxIndex === paxList.length - 1}
          />
        )}
      </div>
    </div>
  );
}

// --- STEP 5 (Optional): /flights/seats ---
function RouteSeats() {
  const navigate = useNavigate();
  const { state, setPassengers, holdBooking, isHolding } = useFlightBooking();
  const [selectedSeats, setSelectedSeats] = useState<Record<number, string>>({});

  // Navigate to payment once hold succeeds
  useEffect(() => {
    if (state.step === 'PAYMENT' && state.tempBooking) {
      navigate('/flights/payment', { replace: false });
    }
  }, [state.step, state.tempBooking, navigate]);

  const handleProceedToPayment = () => {
    const finalPax = [...state.passengers];
    Object.values(selectedSeats).forEach((code, idx) => {
      if (finalPax[idx]) finalPax[idx] = { ...finalPax[idx], SeatCode: code };
    });
    setPassengers(finalPax);

    if (!state.selectedFlight) return;
    holdBooking({
      ResultIndex: state.selectedFlight.ResultIndex,
      TraceId: state.selectedFlight.TraceId,
      Passengers: finalPax,
      FareAmount: state.selectedFlight.Fare.TotalFare,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5">
      <TopHeaderInfo />

      {/* Holding overlay */}
      {isHolding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-xs mx-4">
            <div className="w-16 h-16 bg-[#E0F2FE] rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-[#0EA5E9] animate-bounce" />
            </div>
            <p className="text-[#0F172A] font-bold text-lg">Securing your booking...</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-6 py-5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <h3 className="text-[#0F172A] font-bold text-xl">Choose Your Seat</h3>
          <p className="text-[#64748B] text-sm font-medium mt-0.5">
            Select a preferred seat or skip for auto-assignment at check-in
          </p>
        </div>
        <div className="p-6 overflow-x-auto">
          <SeatMap
            seatMap={state.seatMap}
            onSeatSelect={(segIdx, code) => setSelectedSeats((s) => ({ ...s, [segIdx]: code }))}
            selectedSeats={selectedSeats}
          />
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-[#F1F5F9]">
            <Button
              onClick={handleProceedToPayment}
              variant="outline"
              className="h-12 px-8 rounded-[10px] border-[#E2E8F0] bg-white text-[#64748B] font-semibold hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all text-sm"
            >
              Skip {'—'} Auto Assign Seat
            </Button>
            <Button
              onClick={handleProceedToPayment}
              className="h-12 px-8 rounded-[10px] bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold shadow-md shadow-[#0EA5E9]/25 hover:scale-[1.01] transition-all border-0 text-sm"
            >
              Confirm Seats & Continue {'\u2192'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 6: /flights/payment ─────────────────────────────────────────────────

/** Load Razorpay checkout script once, lazily */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function RoutePayment() {
  const navigate   = useNavigate();
  const { state, isTicketing, completePayment, error, reset } = useFlightBooking();
  const [showTimeout, setShowTimeout] = useState(false);
  const [isPaying,    setIsPaying]    = useState(false);
  const [pendingTxn,  setPendingTxn]  = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flight     = state.selectedFlight;
  const { baseFare, tax: taxes } = fareDisplayFromFlight(flight);
  const grandTotal = state.grandTotal;        // TotalFare + 200
  const bookingId  = state.tempBooking?.Booking_Id ?? '';
  const firstPax   = state.passengers[0];
  const payLegs = normalizeLegSegmentList(flight?.Segments);
  const seg0       = payLegs[0];
  const segLast    = payLegs[payLegs.length - 1];

  const prefill = {
    name:    firstPax?.FullName  ?? 'Traveller',
    email:   firstPax?.Email     ?? '',
    contact: firstPax?.ContactNo ?? '',
  };

  // Navigate on ticketing success / queued
  useEffect(() => {
    if (state.step === 'CONFIRMED' || state.step === 'QUEUED') {
      navigate('/flights/confirmation', { replace: true });
    }
  }, [state.step, navigate]);

  // Clear poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // Amount validation
  const validateAmount = (): boolean => {
    if (!grandTotal || isNaN(grandTotal) || grandTotal <= 200) {
      // <= 200 means TotalFare is 0 - the fare wasn't fetched properly
      toast.error('Invalid fare amount. Please go back and reselect your flight.');
      return false;
    }
    return true;
  };

  // After gateway success -> call ticketing
  const onPaymentVerified = useCallback((transactionId: string) => {
    setIsPaying(false);
    completePayment({
      Booking_Id: bookingId,
      Amount:     grandTotal,
      PaymentMode: 'Online',
      TransactionId: transactionId,
    });
  }, [bookingId, grandTotal, completePayment]);

  // Unified Payment Handler - ONE create-order call only.
  // Uses apiRequest (async auth interceptor) so token is always fresh.
  const handlePayment = async () => {
    if (!validateAmount()) return;
    setIsPaying(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Razorpay SDK failed to load. Please refresh and try again.');

      // STEP 1: Create order ONCE via apiRequest (interceptor adds fresh Bearer token)
      const createOrderRes = await apiRequest<any>(`${apiConfig.baseURL}/payment/create-order`, {
        method: 'POST',
        body: {
          amount:   grandTotal,
          currency: 'INR',
          gateway:  'razorpay',
          purpose:  'flight',
          notes:    { bookingId },
          receipt:  `FLIGHT_${Date.now()}`,
        },
      });
      const orderData = createOrderRes?.data ?? createOrderRes;
      console.log('[Payment] create-order response:', JSON.stringify(orderData));

      const orderId = orderData?.orderId || orderData?.id || orderData?.order_id || orderData?.razorpayOrderId;
      const keyId   = orderData?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      const orderAmount = orderData?.amount || (grandTotal * 100);
      if (!orderId) throw new Error(orderData?.message || 'Order ID missing from response');

      // STEP 2: Open Razorpay with orderId from Step 1 - NO new API call
      const rzpOptions = {
        key:         keyId,
        amount:      orderAmount,
        currency:    orderData?.currency || 'INR',
        name:        'WanderSphere Flights',
        description: (seg0?.Origin ?? '') + ' to ' + (segLast?.Destination ?? '') + ' | ' + (state.searchParams?.DepartureDate ?? ''),
        image:       '/logo.png',
        order_id:    orderId,
        prefill,
        notes: {
          flight:      (seg0?.Origin ?? '') + '-' + (segLast?.Destination ?? ''),
          traceId:     flight?.TraceId ?? '',
          resultIndex: flight?.ResultIndex ?? '',
          bookingId,
        },
        theme: { color: '#0EA5E9' },
        handler: async (rzpResponse: any) => {
          // STEP 3: Verify payment - NOT create-order again
          try {
            const verifyRes = await apiRequest<any>(`${apiConfig.baseURL}/payment/verify`, {
              method: 'POST',
              body: {
                gateway:             'razorpay',
                razorpay_order_id:   rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature:  rzpResponse.razorpay_signature,
                amount:              orderAmount,
                purpose:             'flight',
                bookingId,
                grandTotal,
                baseFare,
                taxes,
                convenienceFee:      state.convenienceFee,
                flightDetails:       flight,
                passengers:          state.passengers,
                paymentGateway:      'razorpay',
              },
            });
            const vd = verifyRes?.data ?? verifyRes;
            if (!vd?.success) throw new Error(vd?.message || 'Payment verification failed');
            onPaymentVerified(rzpResponse.razorpay_payment_id);
          } catch (err: any) {
            setIsPaying(false);
            toast.error(err.message || 'Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            toast.error('Payment cancelled. Try again when ready.');
          },
        },
      };
      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
    } catch (err: any) {
      setIsPaying(false);
      toast.error(err.message || 'Unable to open payment. Please try again.');
    }
  };

  // PhonePe (only called if PhonePe button is explicitly shown in UI)
  const handlePhonePePayment = async () => {
    if (!validateAmount()) return;
    setIsPaying(true);
    try {
      const merchantTransId = 'FLIGHT_' + Date.now() + '_' + Math.random().toString(36).substr(2,9).toUpperCase();
      const ppRes = await apiRequest<any>(`${apiConfig.baseURL}/payment/create-order`, {
        method: 'POST',
        body: {
          amount:               grandTotal,
          currency:             'INR',
          purpose:              'flight',
          bookingId,
          merchantTransactionId: merchantTransId,
          redirectUrl:          window.location.origin + '/flights/payment',
        },
      });
      const ppData = ppRes?.data ?? ppRes;
      if (!ppData?.success) throw new Error(ppData?.message || 'PhonePe order failed');
      sessionStorage.setItem('ws_phonepe_txn',     merchantTransId);
      sessionStorage.setItem('ws_phonepe_booking', bookingId);
      window.location.href = ppData.url;
    } catch (err: any) {
      setIsPaying(false);
      toast.error(err.message || 'PhonePe payment failed. Please try again.');
    }
  };
  return (
    <div className="max-w-4xl mx-auto px-4 py-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <TopHeaderInfo />

      {/* Ticketing overlay */}
      {isTicketing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-xs mx-4">
            <div className="w-16 h-16 bg-[#E0F2FE] rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-[#0EA5E9] animate-bounce" />
            </div>
            <p className="text-[#0F172A] font-bold text-lg">Confirming your booking...</p>
            <p className="text-[#64748B] text-sm mt-2">Please do not close this window.</p>
          </div>
        </div>
      )}

      {/* Order Summary Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden mb-5">
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="text-[#0F172A] font-bold text-xl flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#0EA5E9]" /> Secure Payment
          </h2>
          {state.holdExpiry && (
            <HoldTimer expiresAt={state.holdExpiry} onExpire={() => setShowTimeout(true)} />
          )}
        </div>

        <div className="p-6">
          {/* Flight summary */}
          {flight && seg0 && segLast && (
            <div className="bg-[#F0F9FF] rounded-xl border border-[#BAE6FD] p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-4 h-4 text-[#0EA5E9]" />
                <span className="font-bold text-[#0F172A] text-sm">
                  {seg0.Origin} &rarr; {segLast.Destination}
                </span>
              </div>
              <p className="text-[#64748B] text-xs font-medium">
                {state.searchParams?.DepartureDate} {'\u00B7'}{' '}
                {(state.searchParams?.Adults ?? 1)} Adult {'\u00B7'}{' '}
                {seg0.AirlineCode}-{seg0.FlightNumber}
              </p>
              <div className="flex justify-between mt-2 text-sm font-medium text-[#0F172A]">
                <span>{formatTime(segmentDepartureTime(seg0))}</span>
                <span className="text-[#64748B] text-xs">{seg0.Duration}</span>
                <span>{formatTime(segmentArrivalTime(segLast))}</span>
              </div>
            </div>
          )}

          {/* Fare breakdown */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B] font-medium">Base Fare</span>
              <span className="text-[#0F172A] font-medium">
                {baseFare > 0 ? `\u20B9${baseFare.toLocaleString('en-IN')}` : '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B] font-medium">Taxes & Fees</span>
              <span className="text-[#0F172A] font-medium">
                {taxes > 0 ? `\u20B9${taxes.toLocaleString('en-IN')}` : '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B] font-medium">Convenience Fee</span>
              <span className="text-[#0F172A] font-medium">
                {`\u20B9${state.convenienceFee.toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="h-px bg-[#E2E8F0] my-2" />
            <div className="flex justify-between items-center">
              <span className="text-[#0F172A] font-bold text-base">Total</span>
              <span className="text-[#F59E0B] font-black text-2xl">
                {grandTotal > 200
                  ? `\u20B9${grandTotal.toLocaleString('en-IN')}`
                  : 'Price on request'}
              </span>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-[#64748B] text-xs font-medium py-3 border-t border-[#F1F5F9] mb-5">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit SSL</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> PCI DSS</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Secure Checkout</span>
          </div>

          {/* Pay button */}
          <Button
            onClick={handlePayment}
            disabled={isPaying || isTicketing || grandTotal <= 200}
            className="w-full h-14 rounded-[10px] bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-base shadow-lg shadow-[#0EA5E9]/30 hover:scale-[1.01] transition-all border-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPaying ? (
              <span className="flex items-center gap-2 justify-center">
                <Spinner /> Processing...
              </span>
            ) : (
              `Proceed to Pay \u20B9${grandTotal > 200 ? grandTotal.toLocaleString('en-IN') : '—'} Securely`
            )}
          </Button>

          <p className="text-center text-[#94A3B8] text-xs mt-3">
            Secured by <span className="font-bold text-[#5f259f]">PhonePe</span> &amp;{' '}
            <span className="font-bold text-[#2D81F7]">Razorpay</span>
          </p>
        </div>
      </div>

      {/* Session timeout dialog */}
      <Dialog open={showTimeout} onOpenChange={setShowTimeout}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogTitle className="text-[#0F172A] font-bold">Session Expired</DialogTitle>
          <DialogDescription className="text-[#64748B] text-sm">
            Your seat hold has expired. Please search again to book this flight.
          </DialogDescription>
          <Button
            onClick={() => { reset(); navigate('/flights/search'); }}
            className="w-full h-11 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-[10px] font-bold border-0"
          >
            Search Again
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── STEP 7: /flights/confirmation ───────────────────────────────────────────
function RouteConfirmation() {
  const { state, reset } = useFlightBooking();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-5">
      <BookingConfirmation
        state={state}
        onBookAnother={() => { reset(); navigate('/flights/search'); }}
      />
    </div>
  );
}

// ─── ROOT: wraps all flight routes ───────────────────────────────────────────
export default function Flights() {
  return (
    <FlightBookingProvider>
      <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <StepBar />
        <Routes>
          <Route path="search"       element={<RouteSearch />} />
          <Route path="results"      element={<RequireSession><RouteResults /></RequireSession>} />
          <Route path="review"       element={<RequireSession><RouteReview /></RequireSession>} />
          <Route path="passengers"   element={<RequireSession><RoutePassengers /></RequireSession>} />
          <Route path="seats"        element={<RequireSession><RouteSeats /></RequireSession>} />
          <Route path="payment"      element={<RequireSession><RoutePayment /></RequireSession>} />
          <Route path="confirmation" element={<RouteConfirmation />} />
          <Route path="*"            element={<Navigate to="search" replace />} />
        </Routes>
      </div>
    </FlightBookingProvider>
  );
}

import { CheckCircle, Download, AlertTriangle, Copy, Plane, Users, CalendarDays } from 'lucide-react';
import type { BookingState, TicketResult, TempBookingResult, FlightModel, PassengerInput } from '@/types/flight';
import { Button } from '@/components/ui/button';
import { reprintTicket } from '@/services/flightService';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatTime, formatShortDate, formatPrice } from '@/utils/etravDate';

interface Props {
  state: BookingState;
  onBookAnother: () => void;
}

export function BookingConfirmation({
  state, onBookAnother,
}: Props) {
  const { ticket, tempBooking, selectedFlight: flight, passengers, step, error } = state;
  const isQueued = step === 'QUEUED';
  const queueMessage = error ?? undefined;
  const onReset = onBookAnother;
  const [isDownloading, setIsDownloading] = useState(false);
  const bookingId = ticket?.Booking_Id ?? tempBooking?.Booking_Id ?? '';
  const pnr = ticket?.PNR ?? tempBooking?.PNR ?? '';

  const handleDownload = async () => {
    if (!bookingId) return;
    setIsDownloading(true);
    try {
      const result = await reprintTicket(bookingId);
      if (result.TicketUrl) {
        window.open(result.TicketUrl, '_blank');
      } else {
        toast.info('Ticket PDF will be emailed to you shortly.');
      }
    } catch {
      toast.error('Failed to download ticket. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyPNR = () => {
    navigator.clipboard.writeText(pnr);
    toast.success('PNR copied!');
  };

  const firstSeg = flight?.Segments?.[0]?.[0];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">

      {/* Hero Banner */}
      {isQueued ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#FEF3C7] border-2 border-[#F59E0B] flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-10 h-10 text-[#F59E0B]" />
          </div>
          <h2 className="text-[#0F172A] font-bold text-3xl mb-2">Booking Queued</h2>
          <p className="text-[#64748B] font-medium text-base mb-1">We will email your ticket shortly</p>
          {queueMessage && <p className="text-[#94A3B8] text-sm mt-2">{queueMessage}</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 text-center relative overflow-hidden">
          {/* Confetti decoration (optional pure css or absolute elements) */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E0F2FE] rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#D1FAE5] rounded-full blur-3xl opacity-50 pointer-events-none" />

          {/* Animated checkmark */}
          <div className="relative w-20 h-20 mx-auto mb-5 z-10">
            <div className="w-20 h-20 rounded-full bg-[#10B981] flex items-center justify-center shadow-lg shadow-[#10B981]/30 animate-[bounce_0.6s_ease-out]">
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <h2 className="text-[#0F172A] font-black tracking-tight text-3xl mb-2 relative z-10">Booking Confirmed!</h2>
          <p className="text-[#64748B] font-medium text-base relative z-10">Your e-ticket has been issued successfully.</p>

          {/* PNR Code block */}
          {pnr && (
            <div className="mt-8 inline-flex flex-col items-center bg-[#F8FAFC] border-2 border-[#E2E8F0] border-dashed px-8 py-4 rounded-2xl relative z-10">
              <p className="text-[#64748B] text-xs font-bold uppercase tracking-widest mb-1">Your PNR Number</p>
              <div className="flex items-center gap-4">
                <p className="text-[#0F172A] font-black text-4xl tracking-[0.2em]">{pnr}</p>
                <button
                  onClick={copyPNR}
                  className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center hover:bg-[#F0F9FF] hover:border-[#0EA5E9] transition-all text-[#64748B] hover:text-[#0EA5E9]"
                  title="Copy PNR"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {bookingId && (
                <p className="text-[#94A3B8] text-xs font-medium mt-3 uppercase tracking-wider">
                  Booking ID / {bookingId}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trip Details Card */}
      {flight && firstSeg && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0F172A] font-bold text-sm">
              <Plane className="w-4 h-4 text-[#0EA5E9]" />
              Trip Details
            </div>
            <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-xs">
              <CalendarDays className="w-4 h-4 text-[#0EA5E9]" />
              {formatShortDate(firstSeg.DepartureTime)}
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between relative">
              <div className="text-left w-1/3">
                <p className="text-[#0F172A] font-black tracking-tight text-3xl">{firstSeg.Origin}</p>
                <p className="text-[#64748B] text-sm font-semibold mt-1">
                  {formatTime(firstSeg.DepartureTime)}
                </p>
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full flex items-center gap-2 max-w-[200px] opacity-70">
                  <div className="flex-1 h-[2px] border-b-2 border-dashed border-[#CBD5E1]" />
                  <Plane className="w-5 h-5 text-[#0EA5E9]" />
                  <div className="flex-1 h-[2px] border-b-2 border-dashed border-[#CBD5E1]" />
                </div>
              </div>

              <div className="text-right w-1/3">
                <p className="text-[#0F172A] font-black tracking-tight text-3xl">{flight.Segments[0][flight.Segments[0].length - 1].Destination}</p>
                <p className="text-[#64748B] text-sm font-semibold mt-1">
                  {formatTime(flight.Segments[0][flight.Segments[0].length - 1].ArrivalTime)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Passenger List & Extras */}
      {passengers.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center gap-2 text-[#0F172A] font-bold text-sm">
            <Users className="w-4 h-4 text-[#0EA5E9]" />
            Passenger Information
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {passengers.map((p, i) => {
              const extras = [];
              if (p.MealCode) extras.push(`Meal: ${p.MealCode}`);
              if (p.BaggageCode) extras.push(`Baggage: ${p.BaggageCode}`);
              if (p.SeatCode) extras.push(`Seat: ${p.SeatCode}`);
              if (p.Wheelchair) extras.push('Wheelchair: Yes');

              return (
                <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0EA5E9] font-black text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-[#0F172A] font-bold text-base">{p.Title} {p.FullName}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5E9] bg-[#E0F2FE] border border-[#BAE6FD] px-2 py-0.5 rounded-full inline-block mt-1">
                        {p.PaxType}
                      </span>
                    </div>
                  </div>
                  {extras.length > 0 && (
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {extras.map((extra, idx) => (
                        <span key={idx} className="bg-white text-[#64748B] text-xs font-semibold px-2.5 py-1 border border-[#E2E8F0] rounded-md shadow-sm">
                          {extra}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Summary */}
      {flight && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center gap-2 text-[#0F172A] font-bold text-sm">
            <span className="w-4 h-4 text-[#0EA5E9] font-black flex items-center justify-center border border-[#0EA5E9] rounded-full text-[10px]">\u20B9</span>
            Payment Summary
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="text-center sm:text-left">
                <p className="text-[#64748B] font-semibold text-sm mb-1">Total Amount Paid</p>
                <p className="text-[#94A3B8] text-xs font-medium">Includes base fare, taxes & fees</p>
             </div>
             <p className="text-[#10B981] font-black tracking-tight text-3xl">
                {formatPrice(flight.Fare.TotalFare)}
             </p>
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          onClick={handleDownload}
          disabled={isDownloading || isQueued}
          className="flex-1 h-14 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-black text-base rounded-[10px] shadow-lg shadow-[#0EA5E9]/30 border-0 gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          {isDownloading ? 'Downloading Ticket...' : 'Download E-Ticket'}
        </Button>

        <Button
          onClick={onReset}
          className="flex-1 h-14 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] font-bold text-base rounded-[10px] shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          Book Another Flight
        </Button>
      </div>

    </div>
  );
}

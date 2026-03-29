/**
 * CancellationModal – Confirms cancellation and shows refund amount
 */

import { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { FlightModel } from '@/types/flight';
import { getBalance } from '@/services/flightService';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  bookingId: string;
  pnr: string;
  flight: FlightModel | null;
  onConfirm: () => void;
  onClose: () => void;
  isCancelling: boolean;
}

export function CancellationModal({
  open,
  bookingId,
  pnr,
  flight,
  onConfirm,
  onClose,
  isCancelling,
}: Props) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const fetchBalance = async () => {
    setLoadingBalance(true);
    try {
      const result = await getBalance();
      setBalance(result.Balance);
    } catch {
      toast.error('Could not fetch refund estimate');
    } finally {
      setLoadingBalance(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white border-gray-100 text-gray-900 shadow-xl rounded-2xl max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-gray-900 text-xl font-bold">Cancel Booking</DialogTitle>
          </div>
          <DialogDescription className="text-gray-500 font-medium">
            This action cannot be undone. Cancellation charges may apply.
          </DialogDescription>
        </DialogHeader>

        {/* Booking Details */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3 my-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium uppercase tracking-wider text-xs">PNR</span>
            <span className="text-gray-900 font-mono font-bold">{pnr}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium uppercase tracking-wider text-xs">Booking ID</span>
            <span className="text-gray-900 font-mono font-bold">{bookingId}</span>
          </div>
          {flight && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium uppercase tracking-wider text-xs">Route</span>
              <span className="text-gray-900 font-bold">
                {flight.Segments[0]?.[0]?.Origin} → {flight.Segments[0]?.[flight.Segments[0].length - 1]?.Destination}
              </span>
            </div>
          )}
        </div>

        {/* Refund Estimate */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-bold uppercase tracking-wider text-xs">Estimated Refund</span>
            {balance !== null ? (
              <span className="text-green-600 font-black text-xl">
                ₹{balance.toLocaleString('en-IN')}
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchBalance}
                disabled={loadingBalance}
                className="text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs px-3"
              >
                {loadingBalance ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Check Refund
              </Button>
            )}
          </div>
          <p className="text-gray-400 font-medium text-xs mt-2">
            Actual refund depends on airline cancellation policy and fare rules.
          </p>
        </div>

        <div className="flex gap-4 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isCancelling}
            className="flex-1 border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 rounded-xl shadow-sm font-bold h-12"
          >
            Keep Booking
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isCancelling}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            {isCancelling ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Cancelling…
              </span>
            ) : (
              'Confirm Cancellation'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * FareChangeAlert – Modal shown when Reprice returns a different fare
 */

import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice } from '@/utils/etravDate';
import type { RepriceResult } from '@/types/flight';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  repriceResult: RepriceResult;
  originalFare: number;
  onAccept: () => void;
  onReject: () => void;
}

export function FareChangeAlert({ open, repriceResult, originalFare, onAccept, onReject }: Props) {
  const newFare = repriceResult.Fare.TotalFare;
  const diff = newFare - originalFare;
  const isIncrease = diff > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onReject()}>
      <DialogContent className="bg-white border-gray-100 text-gray-900 shadow-xl rounded-2xl max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-full ${
                isIncrease ? 'bg-red-50' : 'bg-green-50'
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${isIncrease ? 'text-red-600' : 'text-green-600'}`}
              />
            </div>
            <DialogTitle className="text-gray-900 text-xl font-bold">Fare Change Alert</DialogTitle>
          </div>
          <DialogDescription className="text-gray-500 font-medium">
            The price for this flight has changed since your search.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 my-4 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 text-sm">Original Fare</span>
            <span className="font-medium text-gray-700 line-through">
              {formatPrice(originalFare)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">New Fare</span>
            <span className="font-bold text-gray-900 text-lg">
              {formatPrice(newFare)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Difference</span>
            <span
              className={`flex items-center gap-1 font-bold ${
                isIncrease ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {isIncrease ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isIncrease ? '+' : ''}₹{Math.abs(diff).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <p className="text-gray-400 font-medium text-xs text-center">
          Prices change in real-time. This is the current available fare.
        </p>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onReject}
            className="flex-1 border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 shadow-sm font-bold"
          >
            Go Back
          </Button>
          <Button
            onClick={onAccept}
            className={`flex-1 h-12 rounded-xl text-white font-bold shadow-md transition-all active:scale-95 ${
              isIncrease
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Accept & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

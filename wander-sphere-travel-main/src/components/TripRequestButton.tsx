/**
 * TripRequestButton Component
 * Button to request to join a trip with proper state handling
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Clock, X, Loader2 } from 'lucide-react';
import { useTripRequest } from '@/hooks/useTripRequest';

interface TripRequestButtonProps {
  tripId: string;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onSuccess?: () => void;
}

export const TripRequestButton: React.FC<TripRequestButtonProps> = ({
  tripId,
  size = 'sm',
  className = '',
  onSuccess,
}) => {
  const { isRequested, isLoading, requestStatus, sendRequest } = useTripRequest(tripId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isRequested) return; // Already requested

    const success = await sendRequest();
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Sending...
        </>
      );
    }

    switch (requestStatus) {
      case 'pending':
        return (
          <>
            <Clock className="w-4 h-4 mr-2" />
            Pending
          </>
        );
      case 'approved':
        return (
          <>
            <Check className="w-4 h-4 mr-2" />
            Approved
          </>
        );
      case 'rejected':
        return (
          <>
            <X className="w-4 h-4 mr-2" />
            Rejected
          </>
        );
      default:
        return "I'm Interested";
    }
  };

  const getButtonVariant = () => {
    switch (requestStatus) {
      case 'pending':
        return 'outline';
      case 'approved':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Button
      size={size}
      variant={getButtonVariant()}
      className={`${isRequested ? 'cursor-default' : ''} ${className}`}
      onClick={handleClick}
      disabled={isRequested || isLoading}
    >
      {getButtonContent()}
    </Button>
  );
};

export default TripRequestButton;

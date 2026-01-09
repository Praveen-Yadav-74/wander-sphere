/**
 * useTripRequest Hook
 * Handles trip request operations (request to join, check status)
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { apiConfig } from '@/config/api';
import { toast } from '@/components/ui/use-toast';

export const useTripRequest = (tripId: string) => {
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

  // Check if user has already requested
  useEffect(() => {
    checkRequestStatus();
  }, [tripId]);

  const checkRequestStatus = async () => {
    try {
      const response = await apiRequest<any>(
        `${apiConfig.baseURL}/trips/requests/my`
      ) as any;

      if (response.success && response.data) {
        const existingRequest = response.data.find((req: any) => req.trip_id === tripId);
        if (existingRequest) {
          setIsRequested(true);
          setRequestStatus(existingRequest.status);
        }
      }
    } catch (error) {
      console.error('Error checking request status:', error);
    }
  };

  const sendRequest = async (message?: string) => {
    if (isRequested) return;

    setIsLoading(true);
    try {
      const response = await apiRequest<any>(
        `${apiConfig.baseURL}/trips/${tripId}/request`,
        {
          method: 'POST',
          body: { message: message || 'I would like to join this trip!' }
        }
      ) as any;

      if (response.success) {
        setIsRequested(true);
        setRequestStatus('pending');
        toast({
          title: 'Request Sent!',
          description: 'The trip organizer will review your request.',
        });
        return true;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send request. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isRequested,
    isLoading,
    requestStatus,
    sendRequest,
  };
};

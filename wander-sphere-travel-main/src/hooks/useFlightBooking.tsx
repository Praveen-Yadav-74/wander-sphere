/**
 * FlightBookingContext – Global State Machine
 *
 * Manages the full flight booking lifecycle across all nested steps.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchFlights,
  reviewFlight,
  getSSR,
  getSeatMap,
  createTempBooking,
  addPayment,
  issueTicket,
  cancelBooking,
  type TempBookingPayload,
  type AddPaymentPayload,
  type CancellationPayload,
} from '@/services/flightService';
import type {
  BookingState,
  BookingStep,
  FlightModel,
  FlightSearchParams,
  PassengerInput,
} from '@/types/flight';

const HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes

const initialState: BookingState = {
  step: 'IDLE',
  searchParams: null,
  searchResults: [],
  selectedFlight: null,
  repriceResult: null,
  fareRules: [],
  ssrOptions: null,
  seatMap: [],
  passengers: [],
  tempBooking: null,
  ticket: null,
  holdExpiresAt: null,
  error: null,
  fareChanged: false,
  originalFare: 0,
  convenienceFee: 200,
  grandTotal: 0,
};

interface FlightBookingContextValue {
  state: BookingState;
  isSearching: boolean;
  isReviewing: boolean;
  isLoadingSSR: boolean;
  isHolding: boolean;
  isTicketing: boolean;
  isCancelling: boolean;
  error: string | null;
  setStep: (step: BookingStep) => void;
  triggerSearch: (params: FlightSearchParams) => void;
  selectFlight: (flight: FlightModel) => void;
  acceptFareChange: () => void;
  loadSSRAndSeatMap: (ResultIndex: string, TraceId: string) => void;
  setPassengers: (passengers: PassengerInput[]) => void;
  holdBooking: (payload: TempBookingPayload) => void;
  completePayment: (payload: AddPaymentPayload) => void;
  cancelBookingFlow: (payload: CancellationPayload) => void;
  reset: () => void;
}

const FlightBookingContext = createContext<FlightBookingContextValue | undefined>(undefined);

export function FlightBookingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);
  const queryClient = useQueryClient();
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setStep = (step: BookingStep) =>
    setState((s) => ({ ...s, step, error: null }));

  const setError = (error: string) =>
    setState((s) => ({ ...s, step: 'ERROR', error }));

  // ── Phase 1: Search ─────────────────────────────────────────────────────────

  const searchQuery = useQuery({
    queryKey: ['flights', 'search', state.searchParams],
    queryFn: () => searchFlights(state.searchParams!),
    enabled: state.step === 'SEARCHING' && state.searchParams !== null,
    staleTime: 5 * 60 * 1000,   // 5-minute in-memory cache
    gcTime: 10 * 60 * 1000,
    retry: 2,
    select: (results) =>
      // Filter out flights with fewer seats than requested pax
      results.filter(
        (f) =>
          f.SeatsAvailable >=
          (state.searchParams!.Adults +
            state.searchParams!.Children +
            state.searchParams!.Infants)
      ),
  });

  // Sync query results into local state
  const triggerSearch = useCallback((params: FlightSearchParams) => {
    setState((s) => ({
      ...s,
      step: 'SEARCHING',
      searchParams: params,
      searchResults: [],
      selectedFlight: null,
      repriceResult: null,
      fareRules: [],
      error: null,
      grandTotal: 0,
    }));
  }, []);

  if (
    state.step === 'SEARCHING' &&
    searchQuery.isSuccess &&
    searchQuery.data !== undefined
  ) {
    setState((s) => ({
      ...s,
      step: 'RESULTS',
      searchResults: searchQuery.data,
    }));
  }

  if (state.step === 'SEARCHING' && searchQuery.isError) {
    setError((searchQuery.error as Error).message);
  }

  // ── Phase 2: Review (FareRule + Reprice in parallel) ────────────────────────

  const reviewMutation = useMutation({
    mutationFn: ({ ResultIndex, TraceId }: { ResultIndex: string; TraceId: string }) =>
      reviewFlight(ResultIndex, TraceId),
    onMutate: () => setStep('REVIEWING'),
    onSuccess: (data, variables) => {
      const selectedFlight = state.searchResults.find(
        (f) => f.ResultIndex === variables.ResultIndex
      ) ?? null;

      const fareChanged =
        data.reprice.IsPriceChanged &&
        data.reprice.Fare.TotalFare !== selectedFlight?.Fare.TotalFare;

      // BUG 2 fix: use reprice fare if valid, fallback to original selected fare
      const repricedFare = data.reprice.Fare?.TotalFare ?? 0;
      const originalFare = selectedFlight?.Fare?.TotalFare ?? 0;
      const effectiveFare = repricedFare > 0 ? repricedFare : originalFare;
      const CONVENIENCE_FEE = 200;

      setState((s) => ({
        ...s,
        step: 'PASSENGERS',
        selectedFlight: selectedFlight
          ? { ...selectedFlight, Fare: { ...selectedFlight.Fare, ...data.reprice.Fare } }
          : null,
        repriceResult: data.reprice,
        fareRules: data.fareRules,
        fareChanged,
        originalFare: selectedFlight?.Fare.TotalFare ?? 0,
        convenienceFee: CONVENIENCE_FEE,
        grandTotal: effectiveFare > 0 ? effectiveFare + CONVENIENCE_FEE : 0,
      }));
    },
    onError: (err: Error) => setError(err.message),
  });

  const selectFlight = useCallback(
    (flight: FlightModel) => {
      reviewMutation.mutate({
        ResultIndex: flight.ResultIndex,
        TraceId: flight.TraceId,
      });
    },
    [reviewMutation]
  );

  const acceptFareChange = useCallback(() => {
    setState((s) => ({ ...s, fareChanged: false }));
  }, []);

  // ── Phase 3: SSR & Seat Map ─────────────────────────────────────────────────

  const ssrMutation = useMutation({
    mutationFn: ({ ResultIndex, TraceId }: { ResultIndex: string; TraceId: string }) =>
      Promise.all([getSSR(ResultIndex, TraceId), getSeatMap(ResultIndex, TraceId)]),
    onSuccess: ([ssrOptions, seatMap]) => {
      setState((s) => ({ ...s, ssrOptions, seatMap }));
    },
    onError: (err: Error) => console.warn('[SSR] Failed to load SSR/SeatMap:', err.message),
  });

  const loadSSRAndSeatMap = useCallback(
    (ResultIndex: string, TraceId: string) => {
      ssrMutation.mutate({ ResultIndex, TraceId });
    },
    [ssrMutation]
  );

  const setPassengers = useCallback((passengers: PassengerInput[]) => {
    setState((s) => ({ ...s, passengers }));
  }, []);

  // ── Phase 4: Booking Orchestration ──────────────────────────────────────────

  const tempBookingMutation = useMutation({
    mutationFn: (payload: TempBookingPayload) => createTempBooking(payload),
    onMutate: () => setStep('PAYMENT'),
    onSuccess: (data) => {
      const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);
      setState((s) => ({
        ...s,
        tempBooking: data,
        holdExpiresAt: expiresAt,
      }));

      // Auto-expire hold timer
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        setState((s) =>
          s.step === 'PAYMENT'
            ? { ...s, step: 'ERROR', error: 'Booking hold expired. Please search again.' }
            : s
        );
      }, HOLD_DURATION_MS);
    },
    onError: (err: Error) => setError(err.message),
  });

  const holdBooking = useCallback(
    (payload: TempBookingPayload) => {
      tempBookingMutation.mutate(payload);
    },
    [tempBookingMutation]
  );

  const paymentAndTicketMutation = useMutation({
    mutationFn: async (paymentPayload: AddPaymentPayload) => {
      await addPayment(paymentPayload);
      return issueTicket(paymentPayload.Booking_Id);
    },
    onMutate: () => setStep('TICKETING'),
    onSuccess: (ticket) => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      setState((s) => ({ ...s, step: 'CONFIRMED', ticket }));
      // Invalidate any booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (_err: Error, paymentPayload) => {
      // Ticketing failed – backend has already queued it; show QUEUED state
      setState((s) => ({
        ...s,
        step: 'QUEUED',
        error:
          'Your payment was received but ticketing is being processed manually. ' +
          `Booking ID: ${paymentPayload.Booking_Id}`,
      }));
    },
  });

  const completePayment = useCallback(
    (paymentPayload: AddPaymentPayload) => {
      paymentAndTicketMutation.mutate(paymentPayload);
    },
    [paymentAndTicketMutation]
  );

  // ── Phase 5: Cancellation ────────────────────────────────────────────────────

  const cancellationMutation = useMutation({
    mutationFn: (payload: CancellationPayload) => cancelBooking(payload),
    onSuccess: () => {
      setState(initialState);
    },
    onError: (err: Error) => setError(err.message),
  });

  const cancelBookingFlow = useCallback(
    (payload: CancellationPayload) => {
      cancellationMutation.mutate(payload);
    },
    [cancellationMutation]
  );

  // ── Reset ────────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setState(initialState);
  }, []);

  const value = {
    state,
    isSearching: searchQuery.isFetching,
    isReviewing: reviewMutation.isPending,
    isLoadingSSR: ssrMutation.isPending,
    isHolding: tempBookingMutation.isPending,
    isTicketing: paymentAndTicketMutation.isPending,
    isCancelling: cancellationMutation.isPending,
    error: state.error,
    setStep,
    triggerSearch,
    selectFlight,
    acceptFareChange,
    loadSSRAndSeatMap,
    setPassengers,
    holdBooking,
    completePayment,
    cancelBookingFlow,
    reset,
  };

  return <FlightBookingContext.Provider value={value}>{children}</FlightBookingContext.Provider>;
}

export function useFlightBooking() {
  const context = useContext(FlightBookingContext);
  if (!context) {
    throw new Error('useFlightBooking must be used within a FlightBookingProvider');
  }
  return context;
}

/**
 * Flight Service – Frontend API Layer
 * Typed axios calls to the BFF /api/flights/* proxy.
 * Credentials never leave the server.
 */

import axios from 'axios';
import type {
  FlightSearchParams,
  FlightModel,
  FareRule,
  RepriceResult,
  SSRResponse,
  SeatMapSegment,
  PassengerInput,
  TempBookingResult,
  TicketResult,
  ReprintResult,
  CancellationResult,
} from '@/types/flight';

import { supabase } from '@/config/supabase';
import { normalizeSegments } from '@/utils/etravHelpers';

const PROD_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://wander-sphere-ue7e.onrender.com').replace(/\/$/, '');
const LOCAL_URL = 'http://localhost:5000';

const isCapacitor = !!(window as any).Capacitor;
const isProduction = import.meta.env.MODE === 'production' || import.meta.env.PROD;

const resolvedBaseUrl = (isCapacitor || isProduction) ? PROD_URL : LOCAL_URL;

const flightAxios = axios.create({
  baseURL: `${resolvedBaseUrl}/api/flights`,
  withCredentials: true,
});

// Attach auth token from Supabase session directly on every request
flightAxios.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('[flightAxios] Failed to get session token:', err);
  }
  return config;
});

// ── Typed response wrapper ────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await flightAxios.post<ApiResponse<T>>(endpoint, body);
  return res.data.data;
}

async function get<T>(endpoint: string): Promise<T> {
  const res = await flightAxios.get<ApiResponse<T>>(endpoint);
  return res.data.data;
}

// ── Phase 1: Search ───────────────────────────────────────────────────────────

export async function searchFlights(params: FlightSearchParams): Promise<FlightModel[]> {
  const raw = await post<Record<string, unknown>>('/search', params);

  if (import.meta.env.DEV) {
    console.log('[flightService] searchFlights raw keys:', Object.keys(raw ?? {}));
  }

  // Backend normalizes TripDetails → Results (array of trip-leg arrays)
  const resultsArray = (raw?.Results as unknown[][] | undefined) ?? [];

  if (resultsArray.length > 0 && import.meta.env.DEV) {
    const firstFlight = resultsArray[0]?.[0] as any;
    console.log("DATE SAMPLES:", resultsArray.slice(0, 3).map((leg: any) => {
      const f = leg[0] as any;
      return {
        flight: f?.Segments?.[0]?.FlightNumber,
        depTime: f?.Segments?.[0]?.DepartureDateTime,
        arrTime: f?.Segments?.[0]?.ArrivalDateTime,
        totalAmount: f?.Fares?.[0]?.FareDetails?.[0]?.TotalAmount,
        totalFare: f?.Fare?.TotalFare,
      };
    }));
  }

  // Flatten all trip-leg arrays into a single FlightModel[]
  const flights = (resultsArray as FlightModel[][]).flat();
  return flights.map(flight => ({
    ...flight,
    Segments: normalizeSegments(flight.Segments)
  }));
}


// ── Phase 2: Fare Rule & Reprice ──────────────────────────────────────────────

export async function getFareRule(
  ResultIndex: string,
  TraceId: string
): Promise<FareRule[]> {
  try {
    const raw = await post<Record<string, unknown>>('/fare-rule', { ResultIndex, TraceId });

    // eTrav can return fare rules under several different key names
    const rules: unknown[] =
      (raw?.FareRules as unknown[]) ??
      (raw?.FareRule as unknown[]) ??
      (raw?.FareRuleDetails as unknown[]) ??
      [];

    // Normalise each rule to our FareRule shape
    return rules.map((r: unknown) => {
      const rule = r as Record<string, string>;
      return {
        Origin: rule.Origin ?? rule.Org ?? '',
        Destination: rule.Destination ?? rule.Des ?? '',
        Airline: rule.Airline ?? rule.AirlineCode ?? '',
        FareBasisCode: rule.FareBasisCode ?? '',
        FareRuleDetail: rule.FareRuleDetail ?? rule.FareRule_Details ?? rule.Details ?? '',
        FareRestriction: rule.FareRestriction ?? rule.Restriction ?? '',
      };
    });
  } catch (err) {
    console.warn('[flightService] getFareRule failed (non-blocking):', (err as Error).message);
    return [];
  }
}

export async function repriceFlight(
  ResultIndex: string,
  TraceId: string
): Promise<RepriceResult> {
  const result = await post<RepriceResult>('/reprice', { ResultIndex, TraceId });
  const anyResult = result as any;
  if (anyResult?.Flight) {
    anyResult.Flight = {
      ...anyResult.Flight,
      Segments: normalizeSegments(anyResult.Flight.Segments)
    };
  }
  return result;
}

/** Runs Reprice first, then FareRule sequentially to avoid supplier API rate-limiting/locking leading to 502s */
export async function reviewFlight(
  ResultIndex: string,
  TraceId: string
): Promise<{ fareRules: FareRule[]; reprice: RepriceResult }> {
  // Execute sequentially to prevent session locks on eTrav API
  const reprice = await repriceFlight(ResultIndex, TraceId);
  const fareRules = await getFareRule(ResultIndex, TraceId);
  
  return { fareRules, reprice };
}

// ── Phase 3: SSR & Seat Map ───────────────────────────────────────────────────

export async function getSSR(
  ResultIndex: string,
  TraceId: string
): Promise<SSRResponse> {
  const raw = await post<SSRResponse>('/ssr', { ResultIndex, TraceId });
  return raw;
}

export async function getSeatMap(
  ResultIndex: string,
  TraceId: string
): Promise<SeatMapSegment[]> {
  const raw = await post<{ SeatMap?: SeatMapSegment[] }>('/seat-map', { ResultIndex, TraceId });
  return raw.SeatMap ?? [];
}

// ── Phase 4: Booking Orchestration ────────────────────────────────────────────

export interface TempBookingPayload {
  ResultIndex: string;
  TraceId: string;
  Passengers: PassengerInput[];
  FareAmount: number;
}

export async function createTempBooking(
  payload: TempBookingPayload
): Promise<TempBookingResult> {
  return post<TempBookingResult>('/temp-booking', payload);
}

export interface AddPaymentPayload {
  Booking_Id: string;
  Amount: number;
  PaymentMode: string;
  TransactionId?: string;
}

export async function addPayment(payload: AddPaymentPayload): Promise<unknown> {
  return post<unknown>('/add-payment', payload);
}

export async function issueTicket(Booking_Id: string): Promise<TicketResult> {
  return post<TicketResult>('/ticketing', { Booking_Id });
}

// ── Phase 5: Post-Booking ─────────────────────────────────────────────────────

export async function reprintTicket(Booking_Id: string): Promise<ReprintResult> {
  return post<ReprintResult>('/reprint', { Booking_Id });
}

export interface CancellationPayload {
  Booking_Id: string;
  Segments: { Origin: string; Destination: string; FlightNumber: string }[];
}

export async function cancelBooking(
  payload: CancellationPayload
): Promise<CancellationResult> {
  return post<CancellationResult>('/cancellation', payload);
}

export async function getBalance(): Promise<{ Balance: number; Currency: string }> {
  return get<{ Balance: number; Currency: string }>('/balance');
}

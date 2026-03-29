/**
 * Flight Module – TypeScript Types
 * Strict interfaces for the "Client 1.0 – AIR" API.
 * No `any` types. Strict null checks enforced.
 */

// ── Search ────────────────────────────────────────────────────────────────────

export type CabinClass = 'Economy' | 'Business' | 'First' | 'PremiumEconomy';
export type JourneyType = 'OneWay' | 'RoundTrip' | 'SpecialRoundTrip' | 'MultiCity';
export type PaxType = 'Adult' | 'Child' | 'Infant';
export type SeatStatus = 'Available' | 'AvailableChargeable' | 'Occupied' | 'Selected' | 'LadiesOnly' | 'Blocked';

export interface MultiCityLeg {
  Origin: string;
  Destination: string;
  DepartureDate: string;
}

export interface FlightSearchParams {
  Origin: string;           // 3-letter IATA
  Destination: string;      // 3-letter IATA
  DepartureDate: string;    // YYYY-MM-DD
  ReturnDate?: string;      // YYYY-MM-DD (round-trip)
  MultiCityLegs?: MultiCityLeg[];
  Adults: number;
  Children: number;
  Infants: number;
  CabinClass: CabinClass;
  JourneyType: JourneyType;
  DirectFlight?: boolean;
}

export interface Segment {
  Airline: string;
  AirlineCode: string;
  FlightNumber: string;
  Origin: string;
  Destination: string;
  DepartureTime: string;    // ISO datetime
  ArrivalTime: string;      // ISO datetime
  Duration: string;         // e.g. "2h 15m"
  CabinClass: CabinClass;
  SeatsAvailable: number;
  AircraftType?: string;
}

export interface FareBreakdown {
  PaxType: PaxType;
  BaseFare: number;
  Tax: number;
  YQTax: number;
  AdditionalTxnFeeOfrd: number;
  AdditionalTxnFeePub: number;
  PGCharge: number;
  SupplierReissueCharges: number;
}

export interface Fare {
  Currency: string;
  BaseFare: number;
  Tax: number;
  TotalFare: number;
  YQTax: number;
  AdditionalTxnFeeOfrd: number;
  AdditionalTxnFeePub: number;
  PGCharge: number;
  FareBreakdown: FareBreakdown[];
}

/** Clean, normalised model used by the frontend UI */
export interface FlightModel {
  ResultIndex: string;
  TraceId: string;
  Segments: Segment[][];   // outer = legs, inner = segments per leg
  Fare: Fare;
  IsRefundable: boolean;
  FareClassification: string;
  SeatsAvailable: number;  // minimum across all segments
  IsLCC: boolean;
  GSTEnabled: boolean;
  LastTicketDate?: string;
}

// ── Fare Rule & Reprice ───────────────────────────────────────────────────────

export interface FareRule {
  Origin: string;
  Destination: string;
  Airline: string;
  FareBasisCode: string;
  FareRuleDetail: string;
  FareRestriction: string;
}

export interface RepriceResult {
  ResultIndex: string;
  TraceId: string;
  Fare: Fare;
  IsPriceChanged: boolean;
  OldFare?: Fare;
}

// ── SSR ───────────────────────────────────────────────────────────────────────

export interface SSROption {
  Code: string;
  Description: string;
  Amount: number;
  Currency: string;
  FlightNumber: string;
  Origin: string;
  Destination: string;
}

export interface SSRResponse {
  MealDynamic: SSROption[];
  BaggageDetails: SSROption[];
}

// ── Seat Map ──────────────────────────────────────────────────────────────────

export interface SeatInfo {
  Code: string;
  RowNo: string;
  SeatNo: string;
  SeatType: string;
  Status: SeatStatus;
  Compartment: string;
  Deck: string;
  Amount: number;
  Currency: string;
  Description: string;
  IsLadiesSeat: boolean;
  IsInfantSeat: boolean;
}

export interface SeatRow {
  RowNo: string;
  Seats: SeatInfo[];
}

export interface SeatMapSegment {
  FlightNumber: string;
  Origin: string;
  Destination: string;
  RowDetails: SeatRow[];
}

// ── Passenger ─────────────────────────────────────────────────────────────────

export type PassengerTitle = 'Mr' | 'Mrs' | 'Ms' | 'Mstr' | 'Miss';

export interface PassengerInput {
  Title: PassengerTitle;
  FullName: string;
  Age: number;
  PaxType: PaxType;
  Gender: 'Male' | 'Female';
  PassportNo?: string;
  PassportIssuingCountry?: string;
  PassportExpiry?: string;
  Nationality?: string;
  Email: string;
  ContactNo: string;
  MealCode?: string;
  BaggageCode?: string;
  SeatCode?: string;
  Wheelchair?: boolean;
}

// ── Booking ───────────────────────────────────────────────────────────────────

export interface TempBookingResult {
  PNR: string;
  Booking_Id: string;
  Status: string;
  Passengers: PassengerInput[];
  Fare: Fare;
}

export interface TicketResult {
  PNR: string;
  Booking_Id: string;
  Status: string;
  TicketId: string;
  AirlineConfirmationNumber?: string;
}

export interface ReprintResult {
  PNR: string;
  Booking_Id: string;
  TicketUrl?: string;
  ETicketData?: string;
}

export interface CancellationResult {
  PNR: string;
  Booking_Id: string;
  Status: string;
  RefundAmount: number;
  Currency: string;
}

// ── Booking State Machine ─────────────────────────────────────────────────────

export type BookingStep =
  | 'IDLE'
  | 'SEARCHING'
  | 'RESULTS'
  | 'REVIEWING'
  | 'PASSENGERS'
  | 'SEATS'
  | 'PAYMENT'
  | 'TICKETING'
  | 'CONFIRMED'
  | 'QUEUED'
  | 'ERROR';

export interface BookingState {
  step: BookingStep;
  searchParams: FlightSearchParams | null;
  searchResults: FlightModel[];
  selectedFlight: FlightModel | null;
  repriceResult: RepriceResult | null;
  fareRules: FareRule[];
  ssrOptions: SSRResponse | null;
  seatMap: SeatMapSegment[];
  passengers: PassengerInput[];
  tempBooking: TempBookingResult | null;
  ticket: TicketResult | null;
  holdExpiresAt: Date | null;
  holdExpiry?: Date | null;
  error: string | null;
  fareChanged: boolean;
  originalFare?: number;
  convenienceFee?: number;
  grandTotal?: number;
}

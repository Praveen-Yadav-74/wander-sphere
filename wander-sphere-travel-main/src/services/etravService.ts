/**
 * Etrav Service
 * Handles all Etrav B2B API operations (Bus, Flight, Hotel)
 */

import { apiRequest } from '@/utils/api';
import { buildUrl, getAuthHeader, ApiResponse } from '@/config/api';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface BusSearchParams {
  from: string;
  to: string;
  date: string; // ISO date string
  adults?: number;
}

export interface BusSearchResult {
  tripId: string;
  operatorName: string;
  busType: string; // 'Sleeper' | 'Seater' | 'Semi-Sleeper'
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  amenities?: string[];
  // Add other fields from Etrav API response
  [key: string]: any;
}

export interface SeatLayout {
  seatMap: SeatInfo[][];
  bookedSeats: string[];
  ladiesSeats: string[];
  totalSeats: number;
  availableSeats: number;
}

export interface SeatInfo {
  seatNumber: string;
  seatType: 'Sleeper' | 'Seater';
  row: number;
  column: number;
  isAvailable: boolean;
  isLadiesSeat: boolean;
  isBooked: boolean;
  price?: number;
}

export interface FlightSearchParams {
  from: string; // IATA code
  to: string; // IATA code
  date: string; // ISO date string
  returnDate?: string; // For round trip
  adults?: number;
  children?: number;
  infants?: number;
  class?: 'Economy' | 'Business' | 'First';
}

export interface FlightSearchResult {
  resultIndex: string;
  traceId: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  fareType: string;
  // Add other fields from Etrav API response
  [key: string]: any;
}

export interface HotelSearchParams {
  city: string;
  checkIn: string; // ISO date string
  checkOut: string; // ISO date string
  guests?: number;
  rooms?: number;
}

export interface HotelSearchResult {
  hotelId: string;
  resultIndex: string;
  hotelName: string;
  starRating: number;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  pricePerNight: number;
  totalPrice: number;
  images: string[];
  amenities: string[];
  // Add other fields from Etrav API response
  [key: string]: any;
}

export interface PassengerDetails {
  title: string; // 'Mr' | 'Mrs' | 'Ms'
  firstName: string;
  lastName: string;
  age: number;
  gender: 'Male' | 'Female';
  email: string;
  phone: string;
  idNumber?: string;
  idType?: string;
}

export interface BookingDetails {
  totalAmount: number;
  currency: string;
  serviceCharge?: number;
  taxes?: number;
  discount?: number;
  [key: string]: any;
}

// ============================================
// SERVICE CLASS
// ============================================

class EtravService {
  // ============================================
  // BUS OPERATIONS
  // ============================================

  /**
   * Search buses
   */
  async searchBuses(params: BusSearchParams): Promise<ApiResponse<BusSearchResult[]>> {
    const { endpoints } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    
    return await apiRequest<ApiResponse<BusSearchResult[]>>(
      buildUrl(endpoints.etrav.bus.search),
      {
        method: 'POST',
        headers: authHeaders,
        body: params
      }
    );
  }

  /**
   * Get bus seat layout
   */
  async getBusSeatLayout(tripId: string): Promise<ApiResponse<SeatLayout>> {
    const { endpoints } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    
    return await apiRequest<ApiResponse<SeatLayout>>(
      buildUrl(endpoints.etrav.bus.seatLayout),
      {
        method: 'POST',
        headers: authHeaders,
        body: { tripId }
      }
    );
  }

  /**
   * Block bus seats
   */
  async blockBusSeats(
    tripId: string,
    seatNumbers: string[],
    passengerDetails: PassengerDetails[]
  ): Promise<ApiResponse<{ blockId: string; expiryTime: string }>> {
    const { endpoints } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    
    return await apiRequest<ApiResponse<{ blockId: string; expiryTime: string }>>(
      buildUrl(endpoints.etrav.bus.block),
      {
        method: 'POST',
        headers: authHeaders,
        body: {
          tripId,
          seatNumbers,
          passengerDetails
        }
      }
    );
  }

  /**
   * Book bus ticket
   */
  async bookBus(
    blockId: string,
    paymentId: string,
    razorpayOrderId: string,
    bookingDetails: BookingDetails
  ): Promise<ApiResponse<{ booking: any; pnr: string }>> {
    const { endpoints } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    
    return await apiRequest<ApiResponse<{ booking: any; pnr: string }>>(
      buildUrl(endpoints.etrav.bus.book),
      {
        method: 'POST',
        headers: authHeaders,
        body: {
          blockId,
          paymentId,
          razorpayOrderId,
          bookingDetails
        }
      }
    );
  }

  // ============================================
  // FLIGHT OPERATIONS
  // ============================================

  /**
   * Search flights
   */
  async searchFlights(params: FlightSearchParams): Promise<ApiResponse<FlightSearchResult[]>> {
    const { endpoints } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    
    return await apiRequest<ApiResponse<FlightSearchResult[]>>(
      buildUrl(endpoints.etrav.flight.search),
      {
        method: 'POST',
        headers: authHeaders,
        body: params
      }
    );
  }

  /**
   * Get fare rules
   */
  async getFareRules(resultIndex: string, traceId: string): Promise<ApiResponse<any>> {
    const { endpoints } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    
    return await apiRequest<ApiResponse<any>>(
      buildUrl(endpoints.etrav.flight.fareRules),
      {
        method: 'POST',
        headers: authHeaders,
        body: { resultIndex, traceId }
      }
    );
  }

  /**
   * Book flight
   */
  async bookFlight(
    resultIndex: string,
    traceId: string,
    paymentId: string,
    passengerDetails: PassengerDetails[],
    bookingDetails: BookingDetails
  ): Promise<ApiResponse<{ booking: any; pnr: string }>> {
    const { endpoints } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    
    return await apiRequest<ApiResponse<{ booking: any; pnr: string }>>(
      buildUrl(endpoints.etrav.flight.book),
      {
        method: 'POST',
        headers: authHeaders,
        body: {
          resultIndex,
          traceId,
          paymentId,
          passengerDetails,
          bookingDetails
        }
      }
    );
  }

  // ============================================
  // HOTEL OPERATIONS
  // ============================================

  /**
   * Search hotels
   */
  async searchHotels(params: HotelSearchParams): Promise<ApiResponse<HotelSearchResult[]>> {
    const { endpoints } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    
    return await apiRequest<ApiResponse<HotelSearchResult[]>>(
      buildUrl(endpoints.etrav.hotel.search),
      {
        method: 'POST',
        headers: authHeaders,
        body: params
      }
    );
  }

  /**
   * Get room types for a hotel
   */
  async getRoomTypes(hotelId: string, resultIndex: string): Promise<ApiResponse<any>> {
    const { endpoints } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    
    return await apiRequest<ApiResponse<any>>(
      buildUrl(endpoints.etrav.hotel.roomTypes),
      {
        method: 'POST',
        headers: authHeaders,
        body: { hotelId, resultIndex }
      }
    );
  }

  /**
   * Book hotel
   */
  async bookHotel(
    hotelId: string,
    roomId: string,
    paymentId: string,
    guestDetails: PassengerDetails[],
    bookingDetails: BookingDetails
  ): Promise<ApiResponse<{ booking: any; pnr: string }>> {
    const { endpoints } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    
    return await apiRequest<ApiResponse<{ booking: any; pnr: string }>>(
      buildUrl(endpoints.etrav.hotel.book),
      {
        method: 'POST',
        headers: authHeaders,
        body: {
          hotelId,
          roomId,
          paymentId,
          guestDetails,
          bookingDetails
        }
      }
    );
  }
}

// Export singleton instance
export const etravService = new EtravService();
export default etravService;


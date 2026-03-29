/**
 * /api/flights – Production BFF Proxy for the eTrav "Client 1.0 – AIR" API
 *
 * Full booking flow:
 *   Search → FareRule → Reprice → TempBooking → AddPayment → Ticketing → Reprint
 *
 * All routes proxy to the upstream Air API via airApiClient.
 * Credentials are injected server-side; the browser never sees them.
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/supabaseAuth.js';
import { callAirApi, getWalletBalance } from '../services/airApiClient.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  );
}

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return false;
  }
  return true;
}

function apiError(res, error, fallbackStatus = 502) {
  console.error('[FlightsRoute]', error.message);
  const status = error.response?.status || fallbackStatus;
  res.status(status).json({
    success: false,
    message: error.airApiError?.ErrorMessage || error.message || 'Air API error',
    code: error.airApiError?.ErrorCode,
  });
}

function parseEtravDate(dStr) {
  if (!dStr || typeof dStr !== 'string') return dStr;
  // Handle /Date(1743165000000+0530)/ format from eTrav
  const match = dStr.match(/\/Date\((\d+)([+-]\d+)?\)\//);
  if (match) {
    return new Date(parseInt(match[1], 10)).toISOString();
  }
  // Handle DD/MM/YYYY HH:mm format
  const parts = dStr.trim().split(/[\s/:]/);
  if (parts.length >= 5 && dStr.includes('/')) {
    const [DD, MM, YYYY, HH, mm] = parts;
    return `${YYYY}-${MM}-${DD}T${HH}:${mm}:00`;
  }
  // Passthrough ISO strings
  return dStr;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 1: Search
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/flights/search
 * Calls Air_Search
 */
router.post(
  '/search',
  [
    body('Origin').optional().isLength({ min: 3, max: 3 }),
    body('Destination').optional().isLength({ min: 3, max: 3 }),
    body('DepartureDate').optional(),
    body('Adults').optional().isInt({ min: 1, max: 9 }),
    body('Children').optional().isInt({ min: 0, max: 9 }),
    body('Infants').optional().isInt({ min: 0, max: 9 }),
    body('CabinClass').optional().isIn(['Economy', 'Business', 'First', 'PremiumEconomy']),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const ip = getClientIp(req);

      // Map frontend payload to eTrav Production Schema
      const { Origin, Destination, DepartureDate, ReturnDate, Adults, Children, Infants, CabinClass, JourneyType, MultiCityLegs } = req.body;
      
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${month}/${day}/${year}`;
      };
      
      let bookingType = 0;
      if (JourneyType === 'RoundTrip') bookingType = 1;
      else if (JourneyType === 'SpecialRoundTrip') bookingType = 2;
      else if (JourneyType === 'MultiCity') bookingType = 3;

      let tripInfo = [];
      if (JourneyType === 'MultiCity' && MultiCityLegs && MultiCityLegs.length > 0) {
        tripInfo = MultiCityLegs.map((leg, idx) => ({
          Origin: leg.Origin,
          Destination: leg.Destination,
          TravelDate: formatDate(leg.DepartureDate),
          Trip_Id: idx
        }));
      } else if ((JourneyType === 'RoundTrip' || JourneyType === 'SpecialRoundTrip') && ReturnDate) {
        tripInfo = [
          { Origin, Destination, TravelDate: formatDate(DepartureDate), Trip_Id: 0 },
          { Origin: Destination, Destination: Origin, TravelDate: formatDate(ReturnDate), Trip_Id: 1 }
        ];
      } else {
        tripInfo = [
          { Origin, Destination, TravelDate: formatDate(DepartureDate), Trip_Id: 0 }
        ];
      }

      const cabinClassMap = {
        'Economy': 0,
        'Business': 1,
        'First': 2,
        'PremiumEconomy': 3
      };
      const etravCabinClass = CabinClass ? (cabinClassMap[CabinClass] ?? 0) : 0;

      const etravPayload = {
        Travel_Type: 0, // Assuming 0 for now (often auto-resolved or 0=Domestic/1=Intl based on airport mapping, we leave 0)
        Booking_Type: bookingType,
        TripInfo: tripInfo,
        Adult_Count: parseInt(Adults) || 1,
        Child_Count: parseInt(Children) || 0,
        Infant_Count: parseInt(Infants) || 0,
        Class_Of_Travel: etravCabinClass,
        InventoryType: 0 // Mandatory for API
      };

      const data = await callAirApi('Air_Search', etravPayload, ip);

      console.log('[FlightSearch] Response keys:', Object.keys(data || {}));

      let resultsCount = 'N/A';
      const searchKey = data.Search_Key || '';

      // Helper: map a single segment to normalized shape
      const mapSegment = (seg) => ({
        ...seg,
        // Exact eTrav field names
        AirlineCode: seg.AirlineCode || seg.Airline_Code || '',
        AirlineName: seg.AirlineName || seg.Airline_Name || '',
        FlightNumber: seg.FlightNumber || seg.Flight_Number || '',
        // DepartureDateTime / ArrivalDateTime are ISO strings from eTrav
        DepartureDateTime: seg.DepartureDateTime || seg.Departure_DateTime || seg.DepartureTime || null,
        ArrivalDateTime: seg.ArrivalDateTime || seg.Arrival_DateTime || seg.ArrivalTime || null,
        // Flat string airport codes
        Origin: typeof seg.Origin === 'object' ? (seg.Origin?.AirportCode || seg.Origin?.Airport?.AirportCode || '') : (seg.Origin || ''),
        Destination: typeof seg.Destination === 'object' ? (seg.Destination?.AirportCode || seg.Destination?.Airport?.AirportCode || '') : (seg.Destination || ''),
        // Duration is "HH:mm" format from eTrav
        Duration: seg.Duration || '',
      });

      // Helper: map a fare to normalized shape
      const mapFare = (fare) => {
        const fd = fare.FareDetails?.[0] || {};
        const basicAmount = parseFloat(fd.BasicAmount ?? fd.Basic_Amount ?? 0);
        const yqAmount = parseFloat(fd.YQAmount ?? fd.YQ_Amount ?? 0);
        const airportTax = parseFloat(fd.AirportTaxAmount ?? fd.AirportTax_Amount ?? 0);
        const totalAmount = parseFloat(fd.TotalAmount ?? fd.Total_Amount ?? 0) || (basicAmount + yqAmount + airportTax);
        const baggage = fd.FreeBaggage || {};
        return {
          ...fare,
          FareId: fare.FareId || fare.Fare_Id || '',
          FareKey: fare.FareKey || fare.Fare_Key || '',
          Refundable: fare.Refundable === 'True' || fare.Refundable === true,
          SeatsAvailable: parseInt(fare.SeatsAvailable || '9', 10),
          FareDetails: [{
            ...fd,
            PAXType: fd.PAXType ?? fd.Pax_Type ?? '0',
            BasicAmount: basicAmount,
            YQAmount: yqAmount,
            AirportTaxAmount: airportTax,
            TotalAmount: totalAmount,
            CheckInBaggage: baggage.CheckInBaggage || fd.CheckInBaggage || '15 Kg',
            CabinBaggage: baggage.CabinBaggage || fd.CabinBaggage || '7 Kg',
            FreeBaggage: baggage,
          }],
        };
      };

      // Helper: map a full flight to normalized shape
      const mapFlight = (f, idx, searchKeyVal) => {
        const fares = (f.Fares || []).map(mapFare);
        // Segments from eTrav are a flat array (not array of arrays)
        const segs = (f.Segments || []).map(mapSegment);
        const firstFare = fares[0] || {};
        const fareDetails = firstFare.FareDetails?.[0] || {};
        return {
          ...f,
          Flight_Id: f.Flight_Id || f.FlightId || '',
          Flight_Key: f.Flight_Key || f.FlightKey || '',
          // Encode Flight_Key@@FareId into ResultIndex for downstream API calls
          ResultIndex: `${f.Flight_Key || f.FlightKey || idx}@@${firstFare.FareId || ''}`,
          TraceId: searchKeyVal,
          Search_Key: searchKeyVal,
          AirlineCode: segs[0]?.AirlineCode || f.AirlineCode || f.Airline_Code || '',
          AirlineName: segs[0]?.AirlineName || f.AirlineName || f.Airline_Name || '',
          IsLCC: f.IsLCC ?? true,
          Fares: fares,
          Segments: segs, // flat array, as per eTrav spec
          // Convenience fields for FlightCard display
          Fare: {
            BaseFare: fareDetails.BasicAmount || 0,
            Tax: (fareDetails.YQAmount || 0) + (fareDetails.AirportTaxAmount || 0),
            TotalFare: fareDetails.TotalAmount || 0,
            TotalAmount: fareDetails.TotalAmount || 0,
            BasicAmount: fareDetails.BasicAmount || 0,
            YQAmount: fareDetails.YQAmount || 0,
            AirportTaxAmount: fareDetails.AirportTaxAmount || 0,
          },
          SeatsAvailable: parseInt(f.Seats_Available || f.SeatsAvailable || firstFare.SeatsAvailable || '9', 10),
          IsRefundable: firstFare.Refundable || false,
        };
      };

      // Build normalized Results array: one sub-array per trip leg (onward, return)
      data.Results = [];
      if (data?.TripDetails && Array.isArray(data.TripDetails)) {
        data.TripDetails.forEach(trip => {
          const mappedFlights = (trip.Flights || []).map((f, idx) => mapFlight(f, idx, searchKey));
          data.Results.push(mappedFlights);
        });
        resultsCount = data.Results.reduce((acc, curr) => acc + (curr?.length || 0), 0);
      } else if (Array.isArray(data?.Results) && data.Results.length > 0) {
        // Already structured as Results array (fallback)
        data.Results = data.Results.map((legArray) =>
          (legArray || []).map((f, idx) => mapFlight(f, idx, searchKey))
        );
        resultsCount = data.Results.reduce((acc, curr) => acc + (curr?.length || 0), 0);
      }

      console.log('[FlightSearch] Results count:', resultsCount);
      if (resultsCount > 0 && data.Results[0]?.[0]) {
        const s = data.Results[0][0];
        console.log('[FlightSearch] Sample flight:', {
          airline: s.AirlineCode, flight: s.Segments[0]?.FlightNumber,
          dep: s.Segments[0]?.DepartureDateTime, arr: s.Segments[0]?.ArrivalDateTime,
          total: s.Fare.TotalFare
        });
      }

      res.json({ success: true, data });
    } catch (err) {
      apiError(res, err);
    }
  }
);


// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2: Fare Rule & Reprice
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/flights/fare-rule
 * Calls Air_FareRule
 */
router.post(
  '/fare-rule',
  [
    body('ResultIndex').notEmpty().withMessage('ResultIndex is required'),
    body('TraceId').notEmpty().withMessage('TraceId is required'),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const [Flight_Key, Fare_Id] = req.body.ResultIndex.split('@@');
      const Search_Key = req.body.TraceId;
      const etravPayload = { Search_Key, Flight_Key, Fare_Id };

      const data = await callAirApi('Air_FareRule', etravPayload, getClientIp(req));
      res.json({ success: true, data });
    } catch (err) {
      apiError(res, err);
    }
  }
);

/**
 * POST /api/flights/reprice
 * Calls Air_Reprice – confirms the latest fare before booking.
 * Returns price-change info so the frontend can alert the user.
 */
router.post(
  '/reprice',
  [
    body('ResultIndex').notEmpty().withMessage('ResultIndex is required'),
    body('TraceId').notEmpty().withMessage('TraceId is required'),
    body('OriginalFare').optional().isNumeric().withMessage('OriginalFare must be numeric'),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const [Flight_Key, Fare_Id] = req.body.ResultIndex.split('@@');
      const Search_Key = req.body.TraceId;
      
      const etravPayload = { 
         Search_Key, 
         AirRepriceRequests: [
           { Flight_Key, Fare_Id }
         ],
         CustomerMobile: "9999999999" // Use default for anonymous searching
      };

      const data = await callAirApi('Air_Reprice', etravPayload, getClientIp(req));

      // Price-change detection mapping
      const originalFare = parseFloat(req.body.OriginalFare) || 0;
      
      const flightData = data?.Flight || data?.TripDetails?.[0]?.Flights?.[0];
      const fareDetails = flightData?.Fares?.[0]?.FareDetails?.[0];
      const newFare = parseFloat(
        fareDetails?.TotalAmount ??
        fareDetails?.Total_Amount ??
        data?.Fare?.OfferedFare ??
        data?.Fare?.PublishedFare ??
        data?.TotalFare ??
        0
      );

      // Final fallback if it specifically returned 0 but we have fare details
      let finalTotalFare = newFare;
      if (finalTotalFare === 0 && fareDetails) {
        const base = parseFloat(fareDetails.BasicAmount ?? fareDetails.Basic_Amount ?? 0);
        const tx = parseFloat(fareDetails.AirportTaxAmount ?? fareDetails.AirportTax_Amount ?? 0);
        finalTotalFare = base + tx;
      }
      
      const priceChanged = originalFare > 0 && Math.abs(newFare - originalFare) > 0.01;

      // Pack updated Fare_Id into a new ResultIndex if it changed, otherwise reuse
      const nextFareId = flightData?.Fares?.[0]?.Fare_Id || Fare_Id;
      const nextResultIndex = `${Flight_Key}@@${nextFareId}`;

      res.json({
        success: true,
        data: {
           ...data,
           // Send the mapped structures back so frontend Reprice result is parsed
           ResultIndex: nextResultIndex,
           Fare: { TotalFare: finalTotalFare } // Map for the frontend OldFare/NewFare UI
        },
        priceChanged,
        ...(priceChanged && { originalFare, newFare }),
      });
    } catch (err) {
      apiError(res, err);
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 3: SSR & Seat Map
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/flights/ssr
 * Calls Air_GetSSR (meals, baggage)
 */
router.post(
  '/ssr',
  [body('ResultIndex').notEmpty(), body('TraceId').notEmpty()],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const [Flight_Key, Fare_Id] = req.body.ResultIndex.split('@@');
      const Search_Key = req.body.TraceId;
      
      const etravPayload = {
         Search_Key,
         AirSSRRequestDetails: [
           { Flight_Key }
         ]
      };

      const data = await callAirApi('Air_GetSSR', etravPayload, getClientIp(req));
      res.json({ success: true, data });
    } catch (err) {
      apiError(res, err);
    }
  }
);

/**
 * POST /api/flights/seat-map
 * Calls Air_GetSeatMap
 */
router.post(
  '/seat-map',
  [body('ResultIndex').notEmpty(), body('TraceId').notEmpty()],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const [Flight_Key, Fare_Id] = req.body.ResultIndex.split('@@');
      const Search_Key = req.body.TraceId;
      
      // Air_GetSeatMap structurally requires PAXDetails to map seats even before actual pax are confirmed
      const etravPayload = {
         Search_Key,
         Flight_Keys: [ Flight_Key ],
         PAXDetails: [
            {
               Pax_Id: 1,
               Pax_type: "0",
               Title: "Mr",
               FirstName: "Test",
               LastName: "User",
               Gender: "0",
               Age: "30",
               DOB: "01/01/1990",
               PassportNumber: null,
               PassportIssuingCountry: null,
               PassportExpiry: null,
               Nationality: null,
               FrequentFlyerDetails: null
            }
         ]
      };

      const data = await callAirApi('Air_GetSeatMap', etravPayload, getClientIp(req));
      res.json({ success: true, data });
    } catch (err) {
      apiError(res, err);
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 4: Booking Orchestration
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/flights/temp-booking
 * Calls Air_TempBooking – holds the PNR
 * Requires auth
 */
router.post(
  '/temp-booking',
  auth,
  [
    body('ResultIndex').notEmpty(),
    body('TraceId').notEmpty(),
    body('Passengers').isArray({ min: 1 }).withMessage('At least one passenger required'),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const ip = getClientIp(req);
      const [Flight_Key, Fare_Id] = req.body.ResultIndex.split('@@');
      const Search_Key = req.body.TraceId;
      
      // Map frontend passenger details to eTrav PAX_Details
      const bookingSSRDetails = [];
      const mappedPassengers = req.body.Passengers.map((p, i) => {
        let paxTypeEnum = 0; // 0=ADT
        // Support both PaxType (Pascal) and type (lowercase) from frontend
        const paxTypeStr = (p.PaxType || p.type || '').toLowerCase();
        if (paxTypeStr === 'child') paxTypeEnum = 1;
        if (paxTypeStr === 'infant') paxTypeEnum = 2;

        if (p.MealCode) bookingSSRDetails.push({ Code: p.MealCode, SSRWayType: 0, PassengerId: i + 1 });
        if (p.BaggageCode) bookingSSRDetails.push({ Code: p.BaggageCode, SSRWayType: 0, PassengerId: i + 1 });
        if (p.SeatCode) bookingSSRDetails.push({ Code: p.SeatCode, SSRWayType: 0, PassengerId: i + 1 });
        if (p.Wheelchair) bookingSSRDetails.push({ Code: 'WCHR', SSRWayType: 0, PassengerId: i + 1 });

        // Split FullName into First/Last name for the API if possible
        let firstName = p.FullName || p.firstName || '';
        let lastName = '.'; // Standard airline practice for single name

        if (p.FullName?.trim().includes(' ')) {
          const names = p.FullName.trim().split(/\s+/);
          lastName = names.pop();
          firstName = names.join(' ');
        } else if (p.FullName) {
          firstName = p.FullName;
        }

        // Calculate DOB from Age (approximate as Jan 1 of the calculated year)
        let dobStr = p.dob || p.DateOfBirth; 
        if (p.Age !== undefined && !dobStr) {
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - p.Age;
          dobStr = `01/01/${birthYear}`;
        } else if (dobStr && dobStr.includes('-')) {
          const [y, m, d] = dobStr.split('-');
          dobStr = `${m}/${d}/${y}`;
        }

        return {
          Pax_Id: i + 1,
          Pax_type: paxTypeEnum,
          Title: p.Title || p.title || 'Mr',
          First_Name: firstName,
          Last_Name: lastName,
          Gender: (p.Gender === 'Female' || p.gender?.toLowerCase() === 'female') ? 1 : 0,
          Age: p.Age?.toString() || p.age?.toString() || '30',
          DOB: dobStr || '01/01/1990',
          Passport_Number: p.PassportNo || p.passportNumber || null,
          Passport_Issuing_Country: p.PassportIssuingCountry || p.passportCountry || null,
          Passport_Expiry: p.PassportExpiry || p.passportExpiry || null,
          Nationality: p.Nationality || p.nationality || null,
          Pancard_Number: null,
          FrequentFlyerDetails: null
        };
      });

      const firstContact = req.body.Passengers[0];
      // Support both ContactNo (our frontend) and phone (legacy)
      const customerMobile = req.body.CustomerMobile
        || firstContact?.ContactNo
        || firstContact?.phone
        || '9999999999';

      const etravPayload = {
         Customer_Mobile: customerMobile,
         Passenger_Mobile: customerMobile,
         Passenger_Email: req.body.PassengerEmail
           || firstContact?.Email
           || firstContact?.email
           || 'support@wandersphere.com',
         PAX_Details: mappedPassengers,
         GST: false,
         BookingFlightDetails: [
           {
             Search_Key,
             Flight_Key,
             BookingSSRDetails: bookingSSRDetails
           }
         ]
      };
      
      const data = await callAirApi('Air_TempBooking', etravPayload, ip);

      // Persist hold record in Supabase
      const pnr = data?.PNR || data?.Pnr || null;
      const bookingId = data?.Booking_Id || data?.BookingId || null;

      if (pnr || bookingId) {
        await supabase.from('flight_bookings').insert({
          user_id: req.user.id,
          pnr,
          booking_id: bookingId,
          status: 'held',
          fare_amount: req.body.FareAmount || 0,
          passengers: req.body.Passengers,
          raw_response: data,
        }).catch((dbErr) =>
          console.error('[TempBooking] DB insert failed:', dbErr.message)
        );
      }

      res.json({ success: true, data });
    } catch (err) {
      apiError(res, err);
    }
  }
);

/**
 * POST /api/flights/add-payment
 * Calls AddPayment – records payment against the booking
 * Requires auth
 */
router.post(
  '/add-payment',
  auth,
  [
    body('Booking_Id').notEmpty().withMessage('Booking_Id is required'),
    body('Amount').isNumeric().withMessage('Amount must be numeric'),
    body('PaymentMode').notEmpty(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      console.log('[AddPayment] Processing payment for Booking_Id:', req.body.Booking_Id);
      const etravPayload = {
         RefNo: req.body.Booking_Id,
         ProductId: 1, // Flights = 1
         TransactionType: 0, // Booking
         ClientRefNo: `WS_${Date.now()}`
      };
      const data = await callAirApi('AddPayment', etravPayload, getClientIp(req));

      // Update booking status to payment_received
      await supabase
        .from('flight_bookings')
        .update({ status: 'payment_received' })
        .eq('booking_id', req.body.Booking_Id)
        .catch((dbErr) =>
          console.error('[AddPayment] DB update failed:', dbErr.message)
        );

      res.json({ success: true, data });
    } catch (err) {
      apiError(res, err);
    }
  }
);

/**
 * POST /api/flights/ticketing
 * Calls Air_Ticketing – issues the ticket
 * Requires auth
 *
 * SAFETY GATES:
 *   1. Checks wallet balance via GetBalance before issuing
 *   2. NEVER auto-retried (handled by airApiClient)
 *   3. On failure: queues for manual intervention
 */
router.post(
  '/ticketing',
  auth,
  [body('Booking_Id').notEmpty()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const ip = getClientIp(req);
    const bookingId = req.body.Booking_Id;

    try {
      // ── Safety Gate 1: Wallet balance check ───────────────────────────────
      try {
        const wallet = await getWalletBalance(ip);
        console.log(`[Ticketing] Wallet balance: ${wallet.balance} ${wallet.currency}`);

        // If fare amount was stored, compare against balance
        const { data: booking } = await supabase
          .from('flight_bookings')
          .select('fare_amount')
          .eq('booking_id', bookingId)
          .single();

        const requiredAmount = booking?.fare_amount || 0;

        if (requiredAmount > 0 && wallet.balance < requiredAmount) {
          console.error(`[Ticketing] INSUFFICIENT BALANCE: need ${requiredAmount}, have ${wallet.balance}`);
          return res.status(402).json({
            success: false,
            message: 'Insufficient wallet balance to issue ticket.',
            required: requiredAmount,
            available: wallet.balance,
            currency: wallet.currency,
          });
        }
      } catch (balanceErr) {
        // Balance check is best-effort; log but don't block ticketing
        console.warn('[Ticketing] Balance check failed (proceeding):', balanceErr.message);
      }

      // ── Issue the ticket ──────────────────────────────────────────────────
      console.log(`[Ticketing] Issuing ticket for Booking_Id: ${bookingId}`);
      const etravPayload = {
         Booking_RefNo: bookingId,
         Ticketing_Type: "1" // Book_Ticket
      };
      const data = await callAirApi('Air_Ticketing', etravPayload, ip);

      // Update booking status to ticketed
      await supabase
        .from('flight_bookings')
        .update({ status: 'ticketed', raw_response: data })
        .eq('booking_id', bookingId)
        .catch(console.error);

      res.json({ success: true, data });

    } catch (err) {
      // ── CRITICAL: do NOT leave user in limbo ────────────────────────────
      console.error('[Ticketing] FAILED – queuing for manual ticketing:', err.message);

      // Log to flight_queue for manual intervention
      await supabase.from('flight_queue').insert({
        booking_id: bookingId,
        user_id: req.user.id,
        reason: err.message,
        resolved: false,
      }).catch((dbErr) =>
        console.error('[Ticketing] Failed to write to flight_queue:', dbErr.message)
      );

      // Update booking status to 'queue'
      await supabase
        .from('flight_bookings')
        .update({ status: 'queue' })
        .eq('booking_id', bookingId)
        .catch(console.error);

      res.status(202).json({
        success: false,
        queued: true,
        message:
          'Ticketing failed. Your booking has been queued for manual processing. ' +
          'You will receive a confirmation shortly.',
        booking_id: bookingId,
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 5: Post-Booking
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/flights/reprint
 * Calls Air_Reprint – fetches final ticket details
 */
router.post(
  '/reprint',
  auth,
  [body('Booking_Id').notEmpty()],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const etravPayload = { BookingRefNo: req.body.Booking_Id };
      const data = await callAirApi('Air_Reprint', etravPayload, getClientIp(req));
      res.json({ success: true, data });
    } catch (err) {
      apiError(res, err);
    }
  }
);

/**
 * POST /api/flights/cancellation
 * Calls Air_TicketCancellation
 * Requires auth
 */
router.post(
  '/cancellation',
  auth,
  [
    body('Booking_Id').notEmpty(),
    body('Segments').isArray({ min: 1 }).withMessage('Segments required for cancellation'),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const ip = getClientIp(req);
      const data = await callAirApi('Air_TicketCancellation', req.body, ip);

      // Update booking status
      await supabase
        .from('flight_bookings')
        .update({ status: 'cancelled' })
        .eq('booking_id', req.body.Booking_Id)
        .catch(console.error);

      res.json({ success: true, data });
    } catch (err) {
      apiError(res, err);
    }
  }
);

/**
 * GET /api/flights/balance
 * Calls GetBalance – check agent wallet balance
 */
router.get('/balance', auth, async (req, res) => {
  try {
    const wallet = await getWalletBalance(getClientIp(req));
    res.json({ success: true, data: wallet });
  } catch (err) {
    apiError(res, err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 6: Orchestrated Book Flow
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/flights/book-flow
 * Orchestrated endpoint that chains the entire booking pipeline:
 *   Reprice → TempBooking → AddPayment → Ticketing → Reprint
 *
 * Each step is guarded. On failure, returns which step failed
 * plus what was already completed, so the frontend can resume.
 *
 * Requires auth.
 *
 * Request Body:
 * {
 *   ResultIndex, TraceId,          // from search
 *   Passengers: [...],             // passenger details
 *   FareAmount: 5000,              // expected fare
 *   PaymentMode: 'Wallet',         // payment mode
 *   OriginalFare: 5000             // for price-change detection
 * }
 */
router.post(
  '/book-flow',
  auth,
  [
    body('ResultIndex').notEmpty().withMessage('ResultIndex is required'),
    body('TraceId').notEmpty().withMessage('TraceId is required'),
    body('Passengers').isArray({ min: 1 }).withMessage('At least one passenger required'),
    body('FareAmount').isNumeric().withMessage('FareAmount is required'),
    body('PaymentMode').notEmpty().withMessage('PaymentMode is required'),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const ip = getClientIp(req);
    const userId = req.user.id;
    const steps = {};
    let bookingId = null;

    try {
      const [Flight_Key, Fare_Id] = req.body.ResultIndex.split('@@');
      const Search_Key = req.body.TraceId;

      // ── Step 1: Reprice ─────────────────────────────────────────────────
      console.log('[BookFlow] Step 1: Reprice');
      const etravPayload = { 
         Search_Key, 
         AirRepriceRequests: [
           { Flight_Key, Fare_Id }
         ],
         CustomerMobile: req.body.CustomerMobile || "9999999999"
      };

      const repriceData = await callAirApi('Air_Reprice', etravPayload, ip);

      const originalFare = parseFloat(req.body.OriginalFare || req.body.FareAmount);
      const newFare = parseFloat(
        repriceData?.Fare?.OfferedFare ??
        repriceData?.Fare?.PublishedFare ??
        repriceData?.TotalFare ??
        originalFare
      );
      const priceChanged = Math.abs(newFare - originalFare) > 0.01;

      steps.reprice = { completed: true, priceChanged, originalFare, newFare };

      // If price increased, stop and let the frontend confirm
      if (priceChanged && newFare > originalFare) {
        return res.status(200).json({
          success: false,
          message: 'Fare has increased. Please confirm the new price to continue.',
          steps,
          priceChanged: true,
          newFare,
          originalFare,
        });
      }

      // ── Step 2: TempBooking ─────────────────────────────────────────────
      console.log('[BookFlow] Step 2: TempBooking');
      
      // Map updated Fare_Id if Reprice sent a new Fare_Id 
      const flightData = repriceData?.Flight || repriceData?.TripDetails?.[0]?.Flights?.[0];
      const finalFareId = flightData?.Fares?.[0]?.Fare_Id || Fare_Id;

      // Map mappedPassengers structure for TempBooking
      const bookingSSRDetails = [];
      const mappedPassengers = req.body.Passengers.map((p, i) => {
         let paxTypeEnum = 0; // ADT
         if (p.type === 'child') paxTypeEnum = 1;
         if (p.type === 'infant') paxTypeEnum = 2;

         if (p.MealCode) bookingSSRDetails.push({ Code: p.MealCode, SSRWayType: 0, PassengerId: i + 1 });
         if (p.BaggageCode) bookingSSRDetails.push({ Code: p.BaggageCode, SSRWayType: 0, PassengerId: i + 1 });
         if (p.SeatCode) bookingSSRDetails.push({ Code: p.SeatCode, SSRWayType: 0, PassengerId: i + 1 });
         if (p.Wheelchair) bookingSSRDetails.push({ Code: 'WCHR', SSRWayType: 0, PassengerId: i + 1 });

         return {
            Pax_Id: i + 1,
            Pax_type: paxTypeEnum,
            Title: p.title || 'Mr',
            First_Name: p.firstName,
            Last_Name: p.lastName,
            Gender: p.gender?.toLowerCase() === 'female' ? 1 : 0,
            Age: p.age || '30',
            DOB: p.dob || '01/01/1990',
            Passport_Number: p.passportNumber || null,
            Passport_Issuing_Country: p.passportCountry || null,
            Passport_Expiry: p.passportExpiry || null,
            Nationality: null,
            Pancard_Number: null,
            FrequentFlyerDetails: null
         };
      });

      const firstContact = req.body.Passengers[0];
      const customerMobile = req.body.CustomerMobile || firstContact?.phone || '9999999999';

      const tempBookingPayload = {
         Customer_Mobile: customerMobile,
         Passenger_Mobile: customerMobile,
         Passenger_Email: req.body.PassengerEmail || firstContact?.email || 'admin@wandersphere.com',
         PAX_Details: mappedPassengers,
         GST: false,
         BookingFlightDetails: [
           {
             Search_Key,
             Flight_Key,
             BookingSSRDetails: bookingSSRDetails
           }
         ]
      };

      const tempBookingData = await callAirApi('Air_TempBooking', tempBookingPayload, ip);

      bookingId = tempBookingData?.Booking_Id || tempBookingData?.BookingId || null;
      const pnr = tempBookingData?.PNR || tempBookingData?.Pnr || null;

      if (!bookingId) {
        throw new Error('TempBooking did not return a Booking_Id');
      }

      // Persist hold record
      await supabase.from('flight_bookings').insert({
        user_id: userId,
        pnr,
        booking_id: bookingId,
        status: 'held',
        fare_amount: newFare || req.body.FareAmount,
        passengers: req.body.Passengers,
        raw_response: tempBookingData,
      }).catch((dbErr) =>
        console.error('[BookFlow] DB insert failed:', dbErr.message)
      );

      steps.tempBooking = { completed: true, bookingId, pnr };

      // ── Step 3: Wallet Balance Check ────────────────────────────────────
      console.log('[BookFlow] Step 3: Wallet Balance Check');
      try {
        const wallet = await getWalletBalance(ip);
        const requiredAmount = newFare || parseFloat(req.body.FareAmount);

        if (wallet.balance < requiredAmount) {
          steps.walletCheck = { completed: true, sufficient: false, balance: wallet.balance, required: requiredAmount };
          return res.status(402).json({
            success: false,
            message: 'Insufficient wallet balance to issue ticket.',
            steps,
            booking_id: bookingId,
          });
        }
        steps.walletCheck = { completed: true, sufficient: true, balance: wallet.balance };
      } catch (walletErr) {
        // Balance check is best-effort; log and proceed
        console.warn('[BookFlow] Balance check failed (proceeding):', walletErr.message);
        steps.walletCheck = { completed: false, error: walletErr.message };
      }

      // ── Step 4: AddPayment ──────────────────────────────────────────────
      console.log('[BookFlow] Step 4: AddPayment');
      const addPaymentPayload = {
         RefNo: bookingId,
         ProductId: 1, // Flights = 1
         TransactionType: 0, // Booking
         ClientRefNo: `WS_${Date.now()}`
      };
      const paymentData = await callAirApi('AddPayment', addPaymentPayload, ip);

      // Update booking status
      await supabase
        .from('flight_bookings')
        .update({ status: 'payment_received' })
        .eq('booking_id', bookingId)
        .catch(console.error);

      steps.addPayment = { completed: true };

      // ── Step 5: Ticketing ───────────────────────────────────────────────
      console.log('[BookFlow] Step 5: Ticketing');
      let ticketData;
      try {
        ticketData = await callAirApi('Air_Ticketing', {
          Booking_RefNo: bookingId,
          Ticketing_Type: "1"
        }, ip);

        await supabase
          .from('flight_bookings')
          .update({ status: 'ticketed', raw_response: ticketData })
          .eq('booking_id', bookingId)
          .catch(console.error);

        steps.ticketing = { completed: true };
      } catch (ticketErr) {
        // CRITICAL: Ticketing failed after payment – queue for manual processing
        console.error('[BookFlow] Ticketing FAILED after payment:', ticketErr.message);

        await supabase.from('flight_queue').insert({
          booking_id: bookingId,
          user_id: userId,
          reason: ticketErr.message,
          resolved: false,
        }).catch(console.error);

        await supabase
          .from('flight_bookings')
          .update({ status: 'queue' })
          .eq('booking_id', bookingId)
          .catch(console.error);

        steps.ticketing = { completed: false, queued: true, error: ticketErr.message };

        return res.status(202).json({
          success: false,
          queued: true,
          message:
            'Payment received but ticketing failed. ' +
            'Your booking has been queued for manual processing.',
          booking_id: bookingId,
          pnr,
          steps,
        });
      }

      // ── Step 6: Reprint ─────────────────────────────────────────────────
      console.log('[BookFlow] Step 6: Reprint');
      let reprintData = null;
      try {
        reprintData = await callAirApi('Air_Reprint', {
          BookingRefNo: bookingId,
        }, ip);
        steps.reprint = { completed: true };
      } catch (reprintErr) {
        // Reprint failure is non-fatal – ticket is already issued
        console.warn('[BookFlow] Reprint failed (non-fatal):', reprintErr.message);
        steps.reprint = { completed: false, error: reprintErr.message };
      }

      // ── Success ─────────────────────────────────────────────────────────
      console.log('[BookFlow] Completed successfully for Booking_Id:', bookingId);

      res.json({
        success: true,
        message: 'Booking completed successfully!',
        booking_id: bookingId,
        pnr,
        ticketData,
        reprintData,
        steps,
      });

    } catch (err) {
      console.error('[BookFlow] Failed at step:', err.message);

      // Determine which step failed based on what was completed
      const failedStep = !steps.reprice?.completed ? 'reprice'
        : !steps.tempBooking?.completed ? 'temp_booking'
        : !steps.addPayment?.completed ? 'add_payment'
        : 'unknown';

      res.status(err.response?.status || 500).json({
        success: false,
        message: err.airApiError?.ErrorMessage || err.message,
        code: err.airApiError?.ErrorCode,
        failedStep,
        booking_id: bookingId,
        steps,
      });
    }
  }
);

export default router;

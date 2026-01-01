# Etrav Tech B2B API Integration Guide

## 🎉 Overview

This guide documents the complete integration of **Etrav Tech B2B APIs** (Flight v2.5, Hotel v1.2, Bus v2.0) into the WanderSphere travel application.

---

## 📋 What's Been Implemented

### ✅ Backend (Express Routes)
- **`backend/routes/etrav.js`** - Complete proxy layer for all Etrav APIs
  - Bus: Search, Seat Layout, Block, Book
  - Flight: Search, Fare Rules, Book
  - Hotel: Search, Room Types, Book

### ✅ Frontend Service Layer
- **`src/services/etravService.ts`** - TypeScript service with all API methods

### ✅ UI Components (Bus - Priority)
- **`src/components/booking/BusSearch.tsx`** - Search form
- **`src/components/booking/BusCard.tsx`** - Result card display
- **`src/components/booking/BusSeatLayout.tsx`** - Interactive seat map
- **`src/pages/BusBooking.tsx`** - Complete booking flow

### ✅ Integration
- Added routes to `App.tsx`
- Updated `BookingSpace.tsx` with quick booking cards
- Added API endpoints to `src/config/api.ts`

---

## 🚀 Setup Instructions

### Step 1: Configure Environment Variables

#### Backend (`.env` or Render Dashboard)

Add these variables to your backend environment:

```env
ETRAV_API_URL=http://api.etrav.in/
ETRAV_CONSUMER_KEY=your_consumer_key_here
ETRAV_CONSUMER_SECRET=your_consumer_secret_here
```

**Important:** 
- Get your credentials from Etrav Tech dashboard
- Never commit these to GitHub
- Add them to Render/Vercel environment variables

#### Frontend (`.env` or Vercel Dashboard)

```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

---

## 📝 API Response Structure Adaptation

**CRITICAL:** The current implementation uses **placeholder field names** based on common travel API patterns. You **MUST** update these based on your actual Etrav API Postman documentation.

### How to Update:

1. **Open Postman Documentation:**
   - Bus: https://documenter.getpostman.com/view/18594709/UyxqAhQK
   - Flight: https://documenter.getpostman.com/view/18594709/UVJfiFLA
   - Hotel: https://documenter.getpostman.com/view/224462/2s9YsKfWzf

2. **Find Example Responses:**
   - Look for "Example Response" sections
   - Copy the JSON structure

3. **Update Backend Route (`backend/routes/etrav.js`):**
   - Update the `callEtravAPI()` payload structure
   - Update field names in request bodies
   - Update response parsing

4. **Update Frontend Service (`src/services/etravService.ts`):**
   - Update TypeScript interfaces to match actual API responses
   - Update field mappings in components

5. **Update Components:**
   - `BusCard.tsx` - Update field access (e.g., `bus.operatorName` → actual field)
   - `BusSeatLayout.tsx` - Update seat map structure
   - Other components as needed

---

## 🔧 Key Files to Update

### 1. Backend Route (`backend/routes/etrav.js`)

**Current (Placeholder):**
```javascript
const etravResponse = await callEtravAPI('BusHost/BusAPIService.svc/JSONService', 'POST', {
  Origin: from,
  Destination: to,
  JourneyDate: date,
  Adults: adults,
});
```

**Update to match actual Etrav API:**
```javascript
// Based on your Postman docs, it might be:
const etravResponse = await callEtravAPI('BusHost/BusAPIService.svc/JSONService', 'POST', {
  origin: from,
  destination: to,
  journeyDate: date,
  adults: adults,
  // ... other required fields from docs
});
```

### 2. Authentication Headers

**Current:**
```javascript
const headers = {
  'ConsumerKey': ETRAV_CONSUMER_KEY,
  'ConsumerSecret': ETRAV_CONSUMER_SECRET,
};
```

**Check Postman docs** - It might be:
- `Authorization: Bearer <token>`
- `X-API-Key: <key>`
- Different header names

### 3. Response Parsing

**Current:**
```javascript
pnr: etravResponse.PNR || etravResponse.pnr || null
```

**Update based on actual response structure:**
```javascript
pnr: etravResponse.data?.pnr || etravResponse.PNR || null
```

---

## 🧪 Testing Checklist

### Bus Booking Flow:
- [ ] Search buses (verify API call works)
- [ ] View results (verify data displays correctly)
- [ ] Load seat layout (verify seat map renders)
- [ ] Select seats (verify selection works)
- [ ] Block seats (verify API call succeeds)
- [ ] Payment (verify Razorpay integration)
- [ ] Confirm booking (verify PNR saved to database)

### Database:
- [ ] Verify bookings are saved to `bookings` table
- [ ] Check `pnr` field is populated
- [ ] Check `booking_details` JSONB contains Etrav response

---

## 📊 Booking Flow State Machine

```
1. Search → User enters from/to/date
2. Results → Display list of buses/flights/hotels
3. Select → User chooses option
4. Details → Show seat layout / room types / fare rules
5. Block → Reserve seats/rooms (temporary hold)
6. Payment → Razorpay checkout
7. Book → Confirm with Etrav API
8. Save → Store in Supabase `bookings` table
9. Confirmation → Show PNR and success message
```

---

## 🔐 Security Notes

1. **Never expose Etrav credentials to frontend**
   - All API calls go through backend proxy
   - Credentials stored in backend `.env` only

2. **Payment Verification**
   - Always verify Razorpay payment before booking
   - Check payment status with Razorpay API
   - Don't trust frontend payment callbacks alone

3. **Error Handling**
   - All Etrav API errors are caught and logged
   - User-friendly error messages displayed
   - Failed bookings don't charge user

---

## 📁 File Structure

```
wander-sphere-travel-main/
├── backend/
│   ├── routes/
│   │   └── etrav.js              ✅ Etrav API proxy
│   └── config/
│       └── env.js                 ✅ Updated with Etrav vars
├── src/
│   ├── services/
│   │   └── etravService.ts        ✅ Frontend service
│   ├── components/
│   │   └── booking/
│   │       ├── BusSearch.tsx      ✅
│   │       ├── BusCard.tsx        ✅
│   │       └── BusSeatLayout.tsx  ✅
│   ├── pages/
│   │   ├── BusBooking.tsx         ✅ Complete flow
│   │   └── BookingSpace.tsx       ✅ Updated
│   └── config/
│       └── api.ts                 ✅ Updated endpoints
└── ETRAV_INTEGRATION_GUIDE.md     ✅ This file
```

---

## 🐛 Troubleshooting

### Error: "Etrav API error: 401 Unauthorized"
- **Fix:** Check `ETRAV_CONSUMER_KEY` and `ETRAV_CONSUMER_SECRET` are correct
- **Fix:** Verify authentication header format matches Etrav docs

### Error: "Field 'operatorName' is undefined"
- **Fix:** Update `BusCard.tsx` to use actual field names from Etrav response
- **Fix:** Check Postman example response for correct field names

### Error: "Seat layout not loading"
- **Fix:** Verify `tripId` format matches Etrav API requirements
- **Fix:** Check seat layout API endpoint and payload structure

### Error: "Payment succeeded but booking failed"
- **Fix:** Implement Razorpay payment verification before booking
- **Fix:** Add retry logic or refund mechanism

---

## 🎯 Next Steps

1. **Update API Field Names:**
   - Compare Postman docs with current implementation
   - Update all field mappings
   - Test each endpoint

2. **Add Flight & Hotel Components:**
   - Create `FlightSearch.tsx` and `FlightCard.tsx`
   - Create `HotelSearch.tsx` and `HotelCard.tsx`
   - Follow same pattern as Bus components

3. **Enhance Error Handling:**
   - Add retry logic for failed API calls
   - Implement better error messages
   - Add loading states

4. **Add Booking Management:**
   - Create "My Bookings" page
   - Show booking history
   - Add cancel/refund functionality

---

## 📞 Support

If you encounter issues:
1. Check Postman documentation for exact API structure
2. Verify environment variables are set correctly
3. Check browser console and backend logs
4. Test API endpoints directly in Postman first

---

**Status:** ✅ Backend proxy created, Bus UI complete, ready for API field mapping

**Priority:** Update field names based on actual Etrav API responses before production use.


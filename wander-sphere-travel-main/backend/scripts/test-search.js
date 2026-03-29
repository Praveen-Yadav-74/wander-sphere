import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE = process.env.ETRAV_AIR_BASE_URL || 'https://prod-api.etrav.in/Flight/AirAPIService.svc/JSONService/';
const uid = process.env.ETRAV_USER_ID;
const pwd = process.env.ETRAV_PASSWORD;
const auth = { UserId: uid, Password: pwd, IP_Address: '127.0.0.1', Request_Id: 'TEST-SEARCH', IMEI_Number: 'WS-APP-001' };

async function searchFlight(dateStr, label) {
  try {
    const payload = {
      Auth_Header: auth, Travel_Type: 1, Booking_Type: 0,
      TripInfo: [{ Origin: 'DEL', Destination: 'BOM', TravelDate: dateStr, Trip_Id: 0 }],
      Adult_Count: 1, Child_Count: 0, Infant_Count: 0, Class_Of_Travel: 0
    };
    const r = await axios.post(BASE + 'Air_Search', payload, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
    const flights = r.data.TripDetails?.[0]?.Flights || [];
    if (flights.length > 0) {
      console.log(`[SUCCESS] Found flights! First airline: ${flights[0][0].Flight_Details[0].Airline_Name}`);
      fs.writeFileSync('flight-sample.json', JSON.stringify({ Search_Key: r.data.Search_Key, Flight: flights[0][0] }, null, 2), 'utf8');
      console.log('Sample flight written to flight-sample.json');
    }
    return { label, status: r.status, flightCount: flights.length, header: r.data.Response_Header };
  } catch(e) { return { label, error: e.message }; }
}

async function run() {
  const r1 = await searchFlight('03/20/2026', 'MM/DD/YYYY');
  const r2 = await searchFlight('20/03/2026', 'DD/MM/YYYY');
  const r3 = await searchFlight('03/25/2025', 'MM/DD/YYYY (2025)');
  fs.writeFileSync('test-summary.json', JSON.stringify({ r1, r2, r3 }, null, 2), 'utf8');
  console.log('Results written to test-summary.json');
}
run();

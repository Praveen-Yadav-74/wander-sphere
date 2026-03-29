import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.ETRAV_AIR_BASE_URL || 'https://prod-api.etrav.in/Flight/AirAPIService.svc/JSONService/';
const uid = process.env.ETRAV_USER_ID;
const pwd = process.env.ETRAV_PASSWORD;
const auth = { UserId: uid, Password: pwd, IP_Address: '127.0.0.1', Request_Id: 'TEST-002', IMEI_Number: 'WS-APP-001' };

async function search(dateStr, label) {
  try {
    const r = await axios.post(BASE + 'Air_Search', {
      Auth_Header: auth,
      Travel_Type: 1,
      Booking_Type: 0,
      TripInfo: [{ Origin: 'DEL', Destination: 'BOM', TravelDate: dateStr, Trip_Id: 0 }],
      Adult_Count: 1, Child_Count: 0, Infant_Count: 0, Class_Of_Travel: 1 // 1=Economy
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
    
    const flights = r.data.TripDetails?.[0]?.Flights || [];
    console.log(`[${label}] Date: ${dateStr} => Flights: ${flights.length}`);
    if (flights.length > 0) {
      console.log(`  First flight: ${flights[0][0].Flight_Details[0].Flight_Number} - ${flights[0][0].Fare_Details.Total_Fare}`);
    } else {
      console.log(`  Response Header:`, JSON.stringify(r.data.Response_Header));
    }
  } catch(e) { console.log(`[${label}] Error:`, e.status); }
}

async function run() {
  await search('03/20/2026', 'MM/DD/YYYY');
  await search('20/03/2026', 'DD/MM/YYYY');
  // Next week
  await search('03/18/2026', 'MM/DD/YYYY again');
}
run();

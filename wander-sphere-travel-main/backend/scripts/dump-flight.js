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

async function run() {
  const r = await axios.post(BASE + 'Air_Search', {
    Auth_Header: auth, Travel_Type: 1, Booking_Type: 0,
    TripInfo: [{ Origin: 'DEL', Destination: 'BOM', TravelDate: '03/20/2026', Trip_Id: 0 }],
    Adult_Count: 1, Child_Count: 0, Infant_Count: 0, Class_Of_Travel: 0
  }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
  
  if (r.data.TripDetails && r.data.TripDetails[0].Flights.length > 0) {
    const flightData = { Search_Key: r.data.Search_Key, Flight: r.data.TripDetails[0].Flights[0] };
    fs.writeFileSync('flight-sample.json', JSON.stringify(flightData, null, 2), 'utf8');
    console.log('Done writing flight-sample.json');
  } else {
    console.log('No flights found');
  }
}
run();

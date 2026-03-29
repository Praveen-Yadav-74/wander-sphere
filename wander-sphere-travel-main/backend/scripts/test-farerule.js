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
const auth = { UserId: uid, Password: pwd, IP_Address: '127.0.0.1', Request_Id: 'TEST-FR', IMEI_Number: 'WS-APP-001' };

const flightSample = JSON.parse(fs.readFileSync('flight-sample.json', 'utf8'));

async function testFareRule(payload, label) {
  try {
    const r = await axios.post(BASE + 'Air_FareRule', { Auth_Header: auth, ...payload }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
    return { label, status: r.status, success: !!r.data.FareRules, error: r.data.Response_Header?.Error_InnerException || r.data.Response_Header?.Error_Desc };
  } catch(e) {
    return { label, error: e.response?.data || e.message };
  }
}

async function run() {
  const sk = flightSample.Search_Key;
  const fk = flightSample.Flight.Flight_Key;
  
  // CORRECT EXTRACTION: Fare_Id is on Fares[0], not Fares[0].FareDetails[0]
  const fareId = flightSample.Flight.Fares[0].Fare_Id;

  const results = [];
  results.push(await testFareRule({ Search_Key: sk, Flight_Key: fk, Fare_Id: fareId }, 'Fare_Id string'));
  results.push(await testFareRule({ Search_Key: sk, Flight_Key: fk, FareId: fareId }, 'FareId string'));
  
  fs.writeFileSync('farerule-results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Results written to farerule-results.json');
}
run();

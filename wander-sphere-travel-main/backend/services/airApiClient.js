/**
 * Air API Client – Production BFF Proxy
 *
 * Wraps the eTrav "Client 1.0 – AIR" production API with:
 *   • Dual base URLs (Flight vs Trade services)
 *   • Auth-header injection (credentials never leave the server)
 *   • Method-aware retry logic (safe ops only – NEVER retry Air_Ticketing)
 *   • Reconciliation logging for TempBooking, Ticketing, AddPayment
 *
 * Production endpoints:
 *   Flight: https://prod-api.etrav.in/Flight/AirAPIService.svc/JSONService/
 *   Trade:  https://prod-api.etrav.in/trade/TradeAPIService.svc/JSONService/
 */

import axios from 'axios';
import axiosRetry from 'axios-retry';
import { v4 as uuidv4 } from 'uuid';

// ── Configuration ─────────────────────────────────────────────────────────────

const AIR_BASE_URL =
  process.env.ETRAV_AIR_BASE_URL ||
  'https://prod-api.etrav.in/airlinehost/AirAPIService.svc/JSONService/';

const TRADE_BASE_URL =
  process.env.ETRAV_TRADE_BASE_URL ||
  'https://prod-api.etrav.in/tradehost/TradeAPIService.svc/JSONService/';

const USER_ID  = process.env.ETRAV_USER_ID  || '';
const PASSWORD = process.env.ETRAV_PASSWORD || '';
const IMEI     = process.env.ETRAV_IMEI     || 'WS-APP-001';

// Debug log at startup to verify credentials are loaded
console.log('[AirAPI] Config loaded:', {
  AIR_BASE_URL,
  TRADE_BASE_URL,
  USER_ID: USER_ID || '(EMPTY!)',
  PASSWORD: PASSWORD ? `${PASSWORD.substring(0, 3)}***` : '(EMPTY!)',
  IMEI,
});

// ── Method → base-URL routing ─────────────────────────────────────────────────

const TRADE_METHODS = new Set(['AddPayment', 'GetBalance']);

function getBaseUrl(method) {
  return TRADE_METHODS.has(method) ? TRADE_BASE_URL : AIR_BASE_URL;
}

// ── Methods that are safe to auto-retry on transient failures ─────────────────
// CRITICAL: Air_Ticketing and Air_TempBooking are NEVER auto-retried on 5xx.
//           Air_TempBooking is retried only on pure network errors (no response).

const SAFE_RETRY_METHODS = new Set([
  'Air_Search',
  'Air_FareRule',
  'Air_Reprice',
  'Air_GetSSR',
  'Air_GetSeatMap',
  'GetBalance',
]);

// Methods that MUST log full request + response for reconciliation
const RECONCILIATION_METHODS = new Set([
  'Air_TempBooking',
  'Air_Ticketing',
  'AddPayment',
]);

// ── Axios instances ───────────────────────────────────────────────────────────

function createClient(baseURL) {
  const client = axios.create({
    baseURL,
    timeout: 45_000, // 45s for production (some searches are slow)
    headers: { 'Content-Type': 'application/json' },
  });

  // Inject auth credentials into request BODY (production API expects them in the payload)
  client.interceptors.request.use((config) => {
    const clientIp = config.metadata?.clientIp || '0.0.0.0';
    const requestId = config.metadata?.requestId || uuidv4();

    // Wrap credentials inside Auth_Header object (required by eTrav API spec)
    const authHeader = {
      UserId:      USER_ID,
      Password:    PASSWORD,
      IP_Address:  clientIp,
      Request_Id:  requestId,
      IMEI_Number: IMEI,
    };

    let parsedData = config.data;
    if (typeof parsedData === 'string') {
      try {
        parsedData = JSON.parse(parsedData);
      } catch (e) {
        // ignore
      }
    }

    // Check if Auth_Header is already injected (this is a retry)
    if (parsedData?.Auth_Header) {
      return config;
    }

    if (config.data && typeof config.data === 'object') {
      config.data = { Auth_Header: authHeader, ...config.data };
    } else {
      config.data = { Auth_Header: authHeader };
    }

    return config;
  });

  // Normalise 200-with-error responses
  client.interceptors.response.use(
    (response) => {
      const data = response.data;
      if (data && data.Error && data.Error.ErrorCode !== '0' && data.Error.ErrorCode !== 0) {
        const err = new Error(data.Error.ErrorMessage || 'Air API returned an error');
        err.airApiError = data.Error;
        err.response = response; // Attach for status inspection
        throw err;
      }
      return response;
    },
    (error) => {
      console.error('[AirAPI] HTTP Error:', {
        url:    error.config?.url,
        status: error.response?.status,
        data:   error.response?.data,
        msg:    error.message,
      });
      return Promise.reject(error);
    }
  );

  return client;
}

const airClient   = createClient(AIR_BASE_URL);
const tradeClient = createClient(TRADE_BASE_URL);

// ── Retry configuration ──────────────────────────────────────────────────────
// Applied to both clients but the retryCondition checks the method name
// to enforce selective retry.

[airClient, tradeClient].forEach((client) => {
  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,   // 1s → 2s → 4s
    retryCondition: (error) => {
      const method = error.config?.metadata?.apiMethod;

      // NEVER retry Air_Ticketing (financial operation – could double-charge)
      if (method === 'Air_Ticketing') return false;

      // Air_TempBooking: only retry on pure network errors (no response at all)
      if (method === 'Air_TempBooking') {
        return axiosRetry.isNetworkError(error);
      }

      // Safe methods: retry on network errors + 5xx
      if (SAFE_RETRY_METHODS.has(method)) {
        return (
          axiosRetry.isNetworkError(error) ||
          axiosRetry.isRetryableError(error) ||
          (error.response?.status >= 500)
        );
      }

      // All other methods: retry only on network errors
      return axiosRetry.isNetworkError(error);
    },
    onRetry: (retryCount, error) => {
      const method = error.config?.metadata?.apiMethod || error.config?.url;
      console.warn(`[AirAPI] Retry #${retryCount} for ${method}: ${error.message}`);
    },
  });
});

// ── Reconciliation Logger ─────────────────────────────────────────────────────

function logReconciliation(method, requestId, payload, responseData, durationMs) {
  const entry = {
    timestamp: new Date().toISOString(),
    method,
    requestId,
    durationMs,
    request: payload,
    response: responseData,
  };
  console.log(`[RECONCILIATION][${method}]`, JSON.stringify(entry));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Call an eTrav API method.
 *
 * @param {string} method   – e.g. 'Air_Search', 'AddPayment'
 * @param {object} payload  – request body (credentials are injected automatically)
 * @param {string} clientIp – caller's IP address
 * @returns {Promise<object>} – parsed response data
 */
export async function callAirApi(method, payload = {}, clientIp = '0.0.0.0') {
  const client = TRADE_METHODS.has(method) ? tradeClient : airClient;
  const requestId = uuidv4();
  const startTime = Date.now();

  console.log(`[AirAPI] → ${method} | ReqId: ${requestId}`);

  const response = await client.post(method, payload, {
    metadata: { clientIp, apiMethod: method, requestId },
  });

  const durationMs = Date.now() - startTime;
  console.log(`[AirAPI] ← ${method} | ${durationMs}ms | ReqId: ${requestId}`);

  // Reconciliation logging for critical financial operations
  if (RECONCILIATION_METHODS.has(method)) {
    logReconciliation(method, requestId, payload, response.data, durationMs);
  }

  return response.data;
}

/**
 * Check eTrav wallet balance.
 * Convenience wrapper for GetBalance.
 *
 * @param {string} clientIp
 * @returns {Promise<{balance: number, currency: string, raw: object}>}
 */
export async function getWalletBalance(clientIp = '0.0.0.0') {
  const data = await callAirApi('GetBalance', {}, clientIp);
  return {
    balance: parseFloat(data?.Balance ?? data?.balance ?? 0),
    currency: data?.Currency ?? data?.currency ?? 'INR',
    raw: data,
  };
}

export default airClient;

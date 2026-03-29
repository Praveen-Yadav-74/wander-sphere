import crypto from 'crypto';
import axios from 'axios';
import { PAYMENT_CONFIG } from '../../config/paymentConfig.js';
import supabase from '../../config/supabase.js';

/**
 * POST /api/payment/phonepe/create
 * Initiates a PhonePe payment session.
 * amount must be in PAISE (already multiplied by 100)
 */
export const createPhonePeOrder = async (req, res) => {
  try {
    const { amountInPaise, redirectUrl, bookingId, purpose, merchantTransactionId } = req.body;

    // Strict amount validation
    const paise = Math.round(Number(amountInPaise));
    if (!paise || isNaN(paise) || paise <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount. Amount must be a positive number in paise.' });
    }

    const txnId = merchantTransactionId || `FLIGHT_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const userId = req.user ? req.user.id : 'MUID123';

    const finalRedirectUrl = redirectUrl
      ? `${redirectUrl}?txnId=${txnId}&bookingId=${bookingId || ''}&purpose=${purpose || 'flight'}`
      : `${process.env.FRONTEND_URL || 'http://localhost:8080'}/flights/payment?txnId=${txnId}`;

    const payloadData = {
      merchantId: PAYMENT_CONFIG.PHONEPE.MERCHANT_ID,
      merchantTransactionId: txnId,
      merchantUserId: `MUID_${userId}`.substr(0, 36),
      amount: paise,  // Already in paise
      redirectUrl: finalRedirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payment/phonepe-callback`,
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const base64Payload = Buffer.from(JSON.stringify(payloadData), 'utf8').toString('base64');
    const stringToHash = base64Payload + '/pg/v1/pay' + PAYMENT_CONFIG.PHONEPE.SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const xVerify = sha256 + '###' + PAYMENT_CONFIG.PHONEPE.SALT_INDEX;

    const response = await axios.post(
      `${PAYMENT_CONFIG.PHONEPE.HOST_URL}/pg/v1/pay`,
      { request: base64Payload },
      { headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify } }
    );

    console.log('[PhonePe] Order initiated:', response.data?.success, txnId);

    if (response.data?.success) {
      return res.json({
        success: true,
        type: 'phonepe',
        url: response.data.data.instrumentResponse.redirectInfo.url,
        merchantTransactionId: txnId,
      });
    } else {
      throw new Error(response.data?.message || 'PhonePe initiation failed');
    }

  } catch (error) {
    console.error('[PhonePe] Create order error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to create PhonePe order',
      error: error.message,
    });
  }
};

/**
 * POST /api/payment/phonepe/verify
 * Verifies a PhonePe payment and triggers Air_Ticketing for flights.
 */
export const verifyPhonePePayment = async (req, res) => {
  try {
    const { merchantTransactionId, purpose, bookingId, grandTotal, baseFare, taxes, convenienceFee, flightDetails, passengers, paymentGateway } = req.body;

    if (!merchantTransactionId) {
      return res.status(400).json({ success: false, message: 'Missing merchantTransactionId' });
    }

    const merchantId = PAYMENT_CONFIG.PHONEPE.MERCHANT_ID;
    const saltKey = PAYMENT_CONFIG.PHONEPE.SALT_KEY;
    const saltIndex = PAYMENT_CONFIG.PHONEPE.SALT_INDEX;

    const stringToHash = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const xVerify = sha256 + '###' + saltIndex;

    const response = await axios.get(
      `${PAYMENT_CONFIG.PHONEPE.HOST_URL}/pg/v1/status/${merchantId}/${merchantTransactionId}`,
      { headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify, 'X-MERCHANT-ID': merchantId } }
    );

    const paymentSuccess = response.data?.success && response.data?.code === 'PAYMENT_SUCCESS';
    const paymentPending = response.data?.code === 'PAYMENT_PENDING';

    if (paymentPending) {
      return res.json({ success: false, pending: true, message: 'Payment is still processing.' });
    }

    if (!paymentSuccess) {
      return res.status(400).json({ success: false, message: 'Payment verification failed at PhonePe', code: response.data?.code });
    }

    const phonePeTxnId = response.data.data?.transactionId;
    const userId = req.user.id;

    // Update flight_bookings to mark payment success
    if (bookingId) {
      await supabase
        .from('flight_bookings')
        .update({
          payment_status: 'success',
          payment_gateway: paymentGateway || 'phonepe',
          payment_transaction_id: phonePeTxnId,
          merchant_transaction_id: merchantTransactionId,
          base_fare: baseFare || 0,
          taxes: taxes || 0,
          convenience_fee: convenienceFee || 0,
          total_fare: grandTotal,
          flight_details: flightDetails || null,
          passengers: passengers || null,
          booking_status: 'payment_received',
          status: 'payment_received',
        })
        .eq('booking_id', bookingId)
        .catch((e) => console.error('[PhonePe Verify] DB update error:', e.message));
    }

    return res.json({
      success: true,
      message: 'PhonePe payment verified successfully',
      data: { transactionId: phonePeTxnId, merchantTransactionId, bookingId },
    });

  } catch (error) {
    console.error('[PhonePe] Verify error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify PhonePe payment', error: error.message });
  }
};

/**
 * GET /api/payment/phonepe-callback
 * PhonePe server-side callback (webhook) for async notifications.
 */
export const phonePeCallback = async (req, res) => {
  try {
    console.log('[PhonePe Callback] Received:', req.body);
    // Just acknowledge — verification always happens client-side via /verify
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

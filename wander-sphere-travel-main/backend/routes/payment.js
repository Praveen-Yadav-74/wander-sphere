import { PAYMENT_CONFIG } from '../config/paymentConfig.js';
import { createPhonePeOrder, verifyPhonePePayment, phonePeCallback } from './payment/phonepe.js';
import { createRazorpayOrder, verifyRazorpayPayment } from './payment/razorpay.js';
import supabase from '../config/supabase.js';

/**
 * POST /api/payment/create-order
 * PhonePe is PRIMARY, Razorpay is fallback.
 * For flights, always routes via PhonePe unless explicitly requested.
 */
export const createOrder = async (req, res) => {
    const { gateway: requestedGateway, purpose } = req.body;

    // Determine the gateway to use:
    // 1. If explicitly requested (e.g. 'razorpay' for Razorpay fallback)
    // 2. Otherwise, PhonePe is always primary
    let gateway = requestedGateway?.toUpperCase() || PAYMENT_CONFIG.ACTIVE_GATEWAY || 'PHONEPE';

    console.log(`[Payment] Creating order using gateway: ${gateway}, purpose: ${purpose}`);

    if (gateway === 'RAZORPAY') {
        return createRazorpayOrder(req, res);
    } else {
        // PhonePe is primary
        // For PhonePe, frontend must pass amount already validated.
        // We convert rupees → paise if amount is passed (not amountInPaise)
        if (req.body.amount !== undefined && req.body.amountInPaise === undefined) {
            const amountNum = parseFloat(req.body.amount);
            if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid amount.' });
            }
            req.body.amountInPaise = Math.round(amountNum * 100);
        }
        return createPhonePeOrder(req, res);
    }
};

/**
 * POST /api/payment/verify
 * Routes verification to the correct gateway.
 */
export const verifyPayment = async (req, res) => {
    const { gateway, merchantTransactionId, razorpay_order_id } = req.body;

    // Detect by request payload or explicit gateway param
    if (gateway === 'razorpay' || razorpay_order_id) {
        return verifyRazorpayPayment(req, res);
    } else if (gateway === 'phonepe' || merchantTransactionId) {
        return verifyPhonePePayment(req, res);
    } else if (PAYMENT_CONFIG.ACTIVE_GATEWAY === 'RAZORPAY') {
        return verifyRazorpayPayment(req, res);
    } else {
        return verifyPhonePePayment(req, res);
    }
};

/**
 * GET /api/payment/phonepe-callback
 */
export const phonePeWebhookCallback = phonePeCallback;

/**
 * POST /api/payment/pay-from-wallet
 */
export const payFromWallet = async (req, res) => {
  try {
    const { tripId, amount } = req.body;
    const userId = req.user.id;

    if (!tripId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid trip ID or amount' });
    }

    const { data, error } = await supabase.rpc('process_wallet_transaction', {
      p_user_id: userId, p_amount: -amount, p_type: 'booking_payment',
      p_description: `Payment for trip #${tripId} via wallet`, p_reference_id: `trip_${tripId}_${Date.now()}`
    });

    if (error) {
      if (error.message?.includes('Insufficient Wallet Balance')) {
         return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }
      return res.status(500).json({ success: false, message: 'Failed to process wallet payment: ' + error.message });
    }

    if (!data || !data.success) {
      return res.status(500).json({ success: false, message: 'Transaction failed', error: data?.error });
    }

    const { data: existingBooking, error: fetchBookingError } = await supabase
      .from('bookings').select('*').eq('user_id', userId).eq('trip_id', tripId).single();

    if (fetchBookingError && fetchBookingError.code !== 'PGRST116') {
      return res.status(500).json({ success: false, message: 'Payment deducted but booking update failed.' });
    }

    if (existingBooking) {
      await supabase.from('bookings').update({
          status: 'confirmed', payment_status: 'paid', payment_method: 'wallet', updated_at: new Date().toISOString()
      }).eq('id', existingBooking.id);
    } else {
      await supabase.from('bookings').insert({
          user_id: userId, trip_id: tripId, status: 'confirmed', payment_status: 'paid', payment_method: 'wallet', amount_paid: amount
      });
    }

    res.json({ success: true, message: 'Payment successful from wallet', data: { newBalance: data.new_balance, amountPaid: amount, tripId } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process wallet payment', error: error.message });
  }
};

export const switchGateway = (req, res) => {
    const { gateway } = req.body;
    if (gateway !== 'RAZORPAY' && gateway !== 'PHONEPE') {
        return res.status(400).json({ success: false, message: 'Invalid gateway' });
    }
    import('../config/paymentConfig.js').then(({ setGateway }) => {
        setGateway(gateway);
        res.json({ success: true, message: `Gateway switched to ${gateway}`, activeGateway: gateway });
    });
};

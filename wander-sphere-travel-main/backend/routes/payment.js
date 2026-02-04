import crypto from 'crypto';
import razorpayInstance from '../config/razorpay.js';
import SupabaseUser from '../models/SupabaseUser.js';
import supabase from '../config/supabase.js';

/**
 * @route   POST /api/payment/create-order
 * @desc    Create a Razorpay order for payment
 * @access  Private
 */
import axios from 'axios';
import { PAYMENT_CONFIG } from '../config/paymentConfig.js';

/**
 * @route   POST /api/payment/create-order
 * @desc    Create a payment order (Razorpay or PhonePe based on config)
 * @access  Private
 */
export const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes, redirectUrl } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Amount must be greater than 0.',
      });
    }

    // CHECK ACTIVE GATEWAY
    const gateway = PAYMENT_CONFIG.ACTIVE_GATEWAY;
    console.log(`Creating order using gateway: ${gateway}`);

    // --- RAZORPAY FLOW ---
    if (gateway === 'RAZORPAY') {
        const amountInPaise = Math.round(amount * 100);
        const options = {
            amount: amountInPaise,
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: notes || {},
        };

        const order = await razorpayInstance.orders.create(options);
        console.log('Razorpay order created:', order.id);

        return res.status(201).json({
            success: true,
            type: 'razorpay',
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
            },
        });
    }

    // --- PHONEPE FLOW ---
    if (gateway === 'PHONEPE') {
        const merchantTransactionId = `MT${Date.now()}`;
        const userId = req.user ? req.user.id : 'MUID123';
        
        // Construct Payload
        const payloadData = {
            merchantId: PAYMENT_CONFIG.PHONEPE.MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: userId,
            amount: Math.round(amount * 100), // In Paise
            redirectUrl: redirectUrl || 'http://localhost:5173/payment/success', // Verify this URL
            redirectMode: "POST",
            callbackUrl: 'https://webhook.site/your-webhook-url', // Need a valid webhook or server S2S
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        // Base64 Encode
        const bufferObj = Buffer.from(JSON.stringify(payloadData), "utf8");
        const base64EncodedPayload = bufferObj.toString("base64");

        // Calculate X-VERIFY Checksum
        // SHA256(Base64Payload + "/pg/v1/pay" + SALT_KEY) + "###" + SALT_INDEX
        const stringToHash = base64EncodedPayload + "/pg/v1/pay" + PAYMENT_CONFIG.PHONEPE.SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const xVerify = sha256 + "###" + PAYMENT_CONFIG.PHONEPE.SALT_INDEX;

        const options = {
            method: 'post',
            url: `${PAYMENT_CONFIG.PHONEPE.HOST_URL}/pg/v1/pay`,
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify,
            },
            data: {
                request: base64EncodedPayload
            }
        };

        try {
            const response = await axios.request(options);
            console.log('PhonePe Order Initiated:', response.data);
            
            if(response.data.success){
                 return res.json({
                    success: true,
                    type: 'phonepe',
                    url: response.data.data.instrumentResponse.redirectInfo.url,
                    merchantTransactionId
                 });
            } else {
                 throw new Error(response.data.message || 'PhonePe initiation failed');
            }

        } catch (error) {
            console.error('PhonePe API Error:', error.response ? error.response.data : error.message);
            return res.status(500).json({
                success: false,
                message: 'PhonePe Gateway Error',
                error: error.message
            });
        }
    }

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay payment signature and update wallet/booking
 * @access  Private
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      purpose, // 'wallet' or 'trip'
      tripId, // Required if purpose is 'trip'
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields',
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    console.log('Payment signature verified successfully');

    // Get user ID from auth middleware
    const userId = req.user.id;
    // Amount from Razorpay is in paise, convert to rupees for DB
    const amountInRupees = amount / 100;

    // Handle based on purpose
    if (purpose === 'wallet') {
      // Use RPC to process wallet deposit atomically
      const { data, error } = await supabase.rpc('process_wallet_transaction', {
        p_user_id: userId,
        p_amount: amountInRupees,
        p_type: 'deposit',
        p_description: 'Added money via Razorpay',
        p_reference_id: razorpay_payment_id
      });

      if (error) {
        console.error('Error processing wallet deposit:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update wallet balance: ' + error.message,
        });
      }

      if (!data || !data.success) {
        return res.status(500).json({
          success: false,
          message: 'Transaction failed',
          error: data?.error
        });
      }

      console.log(`Wallet updated: User ${userId}, New Balance: ${data.new_balance}`);

      return res.json({
        success: true,
        message: 'Payment verified and wallet updated successfully',
        data: {
          newBalance: data.new_balance,
          amountAdded: amountInRupees,
          transactionId: razorpay_payment_id,
        },
      });

    } else if (purpose === 'trip') {
      // Handle trip payment
      if (!tripId) {
        return res.status(400).json({
          success: false,
          message: 'Trip ID is required for trip payment',
        });
      }

      // 1. Update/Create Booking
      // Check if booking already exists
      const { data: existingBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .eq('trip_id', tripId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching booking:', fetchError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch booking',
        });
      }

      if (existingBooking) {
        // Update existing booking
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            payment_id: razorpay_payment_id,
            payment_method: 'razorpay',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingBooking.id);

        if (updateError) {
          console.error('Error updating booking:', updateError);
          return res.status(500).json({
            success: false,
            message: 'Failed to update booking',
          });
        }
      } else {
        // Create new booking
        const { error: insertError } = await supabase
          .from('bookings')
          .insert({
            user_id: userId,
            trip_id: tripId,
            status: 'confirmed',
            payment_status: 'paid',
            payment_id: razorpay_payment_id,
            payment_method: 'razorpay',
            amount_paid: amountInRupees,
          });

        if (insertError) {
          console.error('Error creating booking:', insertError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create booking',
          });
        }
      }

      console.log(`Trip payment completed: User ${userId}, Trip ${tripId}`);

      return res.json({
        success: true,
        message: 'Payment verified and trip booking confirmed',
        data: {
          tripId,
          amountPaid: amountInRupees,
          transactionId: razorpay_payment_id,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment purpose. Must be "wallet" or "trip".',
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/payment/pay-from-wallet
 * @desc    Pay for a trip using wallet balance
 * @access  Private
 */
export const payFromWallet = async (req, res) => {
  try {
    const { tripId, amount } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!tripId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID or amount',
      });
    }

    // Use RPC to deduct from wallet atomically
    const { data, error } = await supabase.rpc('process_wallet_transaction', {
      p_user_id: userId,
      p_amount: -amount, // Negative for deduction
      p_type: 'booking_payment',
      p_description: `Payment for trip #${tripId} via wallet`,
      p_reference_id: `trip_${tripId}_${Date.now()}`
    });

    if (error) {
      console.error('Error processing wallet payment:', error);
      // Check for specific error messages from RPC
      if (error.message && error.message.includes('Insufficient Wallet Balance')) {
         return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance',
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to process wallet payment: ' + error.message,
      });
    }

    if (!data || !data.success) {
      return res.status(500).json({
        success: false,
        message: 'Transaction failed',
        error: data?.error
      });
    }

    // Success! Now update booking status
    // Create or update booking
    const { data: existingBooking, error: fetchBookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('trip_id', tripId)
      .single();

    if (fetchBookingError && fetchBookingError.code !== 'PGRST116') {
      console.error('Error fetching booking:', fetchBookingError);
      // Warning: Wallet was deducted but booking failed!
      // In a real system, we'd need a rollback or transaction here.
      // For MVP, just return error but log critical failure.
      return res.status(500).json({
        success: false,
        message: 'Payment deducted but booking update failed. Please contact support.',
      });
    }

    if (existingBooking) {
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'wallet',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBooking.id);

      if (updateBookingError) {
        console.error('Error updating booking:', updateBookingError);
        return res.status(500).json({
          success: false,
          message: 'Payment deducted but booking update failed',
        });
      }
    } else {
      const { error: insertBookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          trip_id: tripId,
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'wallet',
          amount_paid: amount,
        });

      if (insertBookingError) {
        console.error('Error creating booking:', insertBookingError);
        return res.status(500).json({
          success: false,
          message: 'Payment deducted but booking creation failed',
        });
      }
    }

    console.log(`Wallet payment completed: User ${userId}, Trip ${tripId}, New Balance: ${data.new_balance}`);

    res.json({
      success: true,
      message: 'Payment successful from wallet',
      data: {
        newBalance: data.new_balance,
        amountPaid: amount,
        tripId,
      },
    });
  } catch (error) {
    console.error('Pay from wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process wallet payment',
      error: error.message,
    });
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

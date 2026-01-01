import express from 'express';
import { body, validationResult } from 'express-validator';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import supabase from '../config/supabase.js';
import { auth } from '../middleware/supabaseAuth.js';
import { config } from '../config/env.js';

const router = express.Router();

/**
 * Create Razorpay order for wallet deposit
 * POST /api/wallet/create-order
 */
router.post('/create-order', auth, [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('receipt').optional().isString().withMessage('Receipt must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { amount, currency = 'INR', receipt } = req.body;

    // Validate amount (minimum ₹1 = 100 paise)
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is ₹1 (100 paise)'
      });
    }

    // Razorpay integration
    if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.'
      });
    }

    const razorpay = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount, // amount in paise
      currency: currency,
      receipt: receipt || `wallet_${userId}_${Date.now()}`,
      payment_capture: 1, // auto capture
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
});

/**
 * Verify Razorpay payment (optional - for additional verification)
 * POST /api/wallet/verify-payment
 */
router.post('/verify-payment', auth, [
  body('razorpay_order_id').isString().withMessage('Order ID is required'),
  body('razorpay_payment_id').isString().withMessage('Payment ID is required'),
  body('razorpay_signature').isString().withMessage('Signature is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify payment signature using Razorpay
    // This provides additional server-side verification for security
    if (!config.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay secret key is not configured'
      });
    }

    const razorpaySecret = config.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
});

export default router;


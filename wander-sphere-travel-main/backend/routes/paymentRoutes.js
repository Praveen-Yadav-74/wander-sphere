import express from 'express';
import { auth } from '../middleware/supabaseAuth.js';
import { createOrder, verifyPayment, payFromWallet, switchGateway } from './payment.js';

const router = express.Router();

// All payment routes require authentication
router.use(auth);

// @route   POST /api/payment/create-order
// @desc    Create a Razorpay order
// @access  Private
router.post('/create-order', createOrder);

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment and update database
// @access  Private
router.post('/verify', verifyPayment);

// @route   POST /api/payment/pay-from-wallet
// @desc    Pay for trip using wallet balance
// @access  Private
router.post('/pay-from-wallet', payFromWallet);

// @route   POST /api/payment/switch-gateway
// @desc    Switch Payment Gateway (Admin)
// @access  Private
router.post('/switch-gateway', switchGateway);

export default router;

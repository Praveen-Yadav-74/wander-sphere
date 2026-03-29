import crypto from 'crypto';
import razorpayInstance from '../../config/razorpay.js';
import supabase from '../../config/supabase.js';

export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;

        // amount must be in rupees here — we convert to paise
        const amountNum = parseFloat(amount);
        if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount. Amount must be a positive number in rupees.' });
        }

        const amountInPaise = Math.round(amountNum * 100);
        const options = {
            amount: amountInPaise,
            currency,
            receipt: receipt || `wsflight_${Date.now()}`,
            notes: notes || {},
        };

        const order = await razorpayInstance.orders.create(options);
        console.log('[Razorpay] Order created:', order.id, 'Amount (paise):', amountInPaise);

        return res.status(201).json({
            success: true,
            type: 'razorpay',
            data: {
                orderId: order.id,
                amount: order.amount,       // In paise
                currency: order.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
            },
        });
    } catch (error) {
        console.error('[Razorpay] Create order error:', error);
        res.status(500).json({ success: false, message: 'Failed to create Razorpay order', error: error.message });
    }
};

export const verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id, razorpay_payment_id, razorpay_signature,
            amount, purpose, tripId,
            // Flight-specific fields
            bookingId, grandTotal, flightDetails, passengers, paymentGateway,
            baseFare, taxes, convenienceFee
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing required Razorpay fields' });
        }

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }

        console.log('[Razorpay] Payment verified:', razorpay_payment_id);

        const userId = req.user.id;
        // amount from Razorpay response is always in paise; convert back to rupees for DB
        const amountInRupees = amount ? amount / 100 : (totalFare || 0);

        // ── Flight purpose ──
        if (purpose === 'flight') {
            if (bookingId) {
                await supabase
                    .from('flight_bookings')
                    .update({
                        payment_status: 'success',
                        payment_gateway: paymentGateway || 'razorpay',
                        payment_transaction_id: razorpay_payment_id,
                        booking_status: 'payment_received',
                        status: 'payment_received',
                        base_fare: baseFare || 0,
                        taxes: taxes || 0,
                        convenience_fee: convenienceFee || 0,
                        total_fare: grandTotal || amountInRupees,
                        flight_details: flightDetails || null,
                        passengers: passengers || null,
                    })
                    .eq('booking_id', bookingId)
                    .catch((e) => console.error('[Razorpay Verify] DB update error:', e.message));
            }
            return res.json({
                success: true,
                message: 'Razorpay flight payment verified',
                data: { transactionId: razorpay_payment_id, bookingId, amountPaid: amountInRupees },
            });
        }

        // ── Wallet purpose ──
        if (purpose === 'wallet') {
            const { data, error } = await supabase.rpc('process_wallet_transaction', {
                p_user_id: userId,
                p_amount: amountInRupees,
                p_type: 'deposit',
                p_description: 'Added money via Razorpay',
                p_reference_id: razorpay_payment_id,
            });

            if (error || !data?.success) {
                return res.status(500).json({ success: false, message: 'Wallet transaction failed', error: data?.error });
            }

            return res.json({
                success: true,
                message: 'Payment verified and wallet updated',
                data: { newBalance: data.new_balance, amountAdded: amountInRupees, transactionId: razorpay_payment_id },
            });
        }

        // ── Trip purpose ──
        if (purpose === 'trip') {
            if (!tripId) {
                return res.status(400).json({ success: false, message: 'Trip ID is required for trip payment' });
            }

            const { data: existingBooking } = await supabase
                .from('bookings').select('*').eq('user_id', userId).eq('trip_id', tripId).single();

            if (existingBooking) {
                await supabase.from('bookings').update({
                    status: 'confirmed', payment_status: 'paid',
                    payment_id: razorpay_payment_id, payment_method: 'razorpay',
                    updated_at: new Date().toISOString(),
                }).eq('id', existingBooking.id);
            } else {
                await supabase.from('bookings').insert({
                    user_id: userId, trip_id: tripId,
                    status: 'confirmed', payment_status: 'paid',
                    payment_id: razorpay_payment_id, payment_method: 'razorpay',
                    amount_paid: amountInRupees,
                });
            }

            return res.json({
                success: true,
                message: 'Payment verified and trip booking confirmed',
                data: { tripId, amountPaid: amountInRupees, transactionId: razorpay_payment_id },
            });
        }

        return res.status(400).json({ success: false, message: 'Invalid payment purpose.' });

    } catch (error) {
        console.error('[Razorpay] Verify error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify Razorpay payment', error: error.message });
    }
};

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { paymentService } from '../../services/paymentService'; // We'll need to export verifyPhonePePayment or add it to paymentService
import { toast } from 'sonner';

// Since Flights uses a complex state hook, we need to finalize the booking on the backend 
// OR call the ticketing API after successful verification here.
import { apiRequest } from '../../utils/api';
import { apiConfig } from '../../config/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verify = async () => {
      try {
        // PhonePe sends back POST data but if we forced REDIRECT it comes in URL query depending on their setup.
        // Actually, PhonePe REDIRECT mode sends transactionId, code, merchantId via POST still?
        // Wait, PhonePe documentation says if redirectMode is REDIRECT, it redirects via GET. 
        // We also have our custom query params: bookingId, amount, purpose
        
        const transactionId = searchParams.get('transactionId') || searchParams.get('merchantTransactionId');
        const code = searchParams.get('code');
        const bookingId = searchParams.get('bookingId');
        const amount = searchParams.get('amount');
        const purpose = searchParams.get('purpose');

        // Note: For test environment without webhook, we just check status via API
        // If transactionId is missing, maybe it's a POST request (handled by backend callback config instead?)
        // Let's assume the transactionId is passed.
        
        if (!transactionId && !bookingId) {
            setStatus('error');
            setMessage('Invalid payment response. Missing tracking IDs.');
            return;
        }

        // Call backend verify
        const verifyResponse = await paymentService.verifyPayment({
          merchantTransactionId: transactionId || 'UNKNOWN',
          amount: Number(amount) || 0,
          purpose: purpose || 'trip',
          tripId: bookingId,
        });

        if (verifyResponse.success) {
           setStatus('success');
           setMessage('Payment verified successfully!');
           
           if (purpose === 'flight' && bookingId) {
               // We need to issue ticket for flight
               setMessage('Payment successful! Generating your ticket...');
               try {
                   await apiRequest(`${apiConfig.baseURL}/flights/ticketing`, {
                     method: 'POST',
                     body: {
                         Booking_Id: bookingId,
                         Amount: Number(amount),
                         PaymentMode: 'Online',
                         TransactionId: verifyResponse.data?.transactionId || transactionId
                     }
                   });
                   setMessage('Ticket generated successfully!');
                   setTimeout(() => navigate(`/booking-confirmation/${bookingId}`), 2000);
               } catch (ticketErr: any) {
                   console.error('Ticketing failed after payment:', ticketErr);
                   setStatus('error');
                   setMessage('Payment succeeded but ticketing failed. Please contact support.');
               }
           } else if (purpose === 'wallet') {
               setTimeout(() => navigate('/wallet'), 2000);
           } else {
               setTimeout(() => navigate('/trips'), 2000);
           }
        } else {
           setStatus('error');
           setMessage('Payment verification failed.');
        }

      } catch (error: any) {
        console.error('Verification Error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred during verification.');
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        {status === 'verifying' && (
          <>
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 flex items-center justify-center rounded-full shrink-0">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Processing Payment</h2>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 bg-green-50 text-green-500 flex items-center justify-center rounded-full shrink-0">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 flex items-center justify-center rounded-full shrink-0">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
            <p className="text-gray-500">{message}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

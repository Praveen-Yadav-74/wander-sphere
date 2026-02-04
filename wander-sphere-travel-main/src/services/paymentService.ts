import { apiRequest } from '../utils/api';
import { apiConfig } from '../config/api';
import { Capacitor } from '@capacitor/core';

export interface CreateOrderRequest {
  amount: number; // Amount in rupees
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResponse {
  type: 'razorpay' | 'phonepe';
  orderId?: string;
  amount?: number; // Amount in paise
  currency?: string;
  keyId?: string;
  url?: string; // For PhonePe
  merchantTransactionId?: string;
}

export interface VerifyPaymentResponse {
  success: true;
  message: string;
  data: any;
}

class PaymentService {
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    const response = await apiRequest<any>(`${apiConfig.baseURL}/payment/create-order`, {
      method: 'POST',
      body: data,
    });
    return response.data || response; // Handle both wrapper styles if necessary, usually response is the data
  }

  async verifyPayment(data: any): Promise<VerifyPaymentResponse> {
    const response = await apiRequest<VerifyPaymentResponse>(`${apiConfig.baseURL}/payment/verify`, {
      method: 'POST',
      body: data,
    });
    return response;
  }

  /**
   * Complete payment flow: Create order → Open Razorpay OR Redirect to PhonePe
   * 
   * @param amount - Amount in rupees
   * @param purpose - 'wallet' or 'trip'
   * @param tripId - Required if purpose is 'trip'
   * @param openRazorpay - Function from useRazorpay hook
   * @param onSuccess - Callback on successful payment (Razorpay only)
   * @param onFailure - Callback on payment failure
   * @param userDetails - User info for prefill
   */
  async processPayment(
    amount: number,
    purpose: 'wallet' | 'trip',
    tripId: string | undefined,
    openRazorpay: (options: any) => void,
    onSuccess?: (result: VerifyPaymentResponse) => void,
    onFailure?: (error: Error) => void,
    userDetails?: { name?: string; email?: string; contact?: string }
  ) {
    try {
      // Step 1: Create order
      const orderData = await this.createOrder({
        amount,
        currency: 'INR',
        notes: {
          purpose,
          tripId: tripId || '',
        },
      });

      // --- PHONEPE LOGIC ---
      if (orderData.type === 'phonepe' && orderData.url) {
          console.log('Redirecting to PhonePe:', orderData.url);
          window.location.href = orderData.url;
          return;
      }

      // --- RAZORPAY LOGIC ---
      if (orderData.type === 'razorpay' || !orderData.type) {
         // Check if running in native Capacitor app
         const isNative = Capacitor.isNativePlatform();
         
         if (isNative) {
           // Use native Razorpay plugin for Android
           console.log('🚀 Using native Razorpay plugin');
           try {
             // Dynamically import the plugin only when needed
             const RazorpayPlugin = await import('capacitor-razorpay');
             const Razorpay = RazorpayPlugin.Checkout;
             
             const options = {
               key: orderData.keyId,
               amount: orderData.amount?.toString() || '0',
               currency: orderData.currency,
               name: 'WanderSphere',
               description: purpose === 'wallet' ? 'Add money to wallet' : 'Trip payment',
               order_id: orderData.orderId,
               prefill: {
                 name: userDetails?.name || '',
                 email: userDetails?.email || '',
                 contact: userDetails?.contact || ''
               },
               theme: {
                 color: '#667eea'
               }
             };
             
             // Open native Razorpay
             const result = await Razorpay.open(options);
             
             // Parse response (capacitor-razorpay returns {response: jsonString})
             let paymentData: any = result;
             if (typeof (result as any).response === 'string') {
               try {
                 paymentData = JSON.parse((result as any).response);
               } catch {
                 paymentData = result;
               }
             }
             
             // Verify payment
             if (paymentData && paymentData.razorpay_payment_id) {
               const verifyData = await this.verifyPayment({
                 razorpay_order_id: paymentData.razorpay_order_id,
                 razorpay_payment_id: paymentData.razorpay_payment_id,
                 razorpay_signature: paymentData.razorpay_signature,
                 amount: orderData.amount!,
                 purpose,
                 tripId,
               });

               if (onSuccess) {
                 onSuccess(verifyData);
               }
             }
           } catch (error: any) {
             console.error('Native Razorpay error:', error);
             if (onFailure) {
               onFailure(error instanceof Error ? error : new Error(error?.message || 'Payment failed'));
             }
           }
         } else {
           // Use web checkout for browser
           console.log('🌐 Using web Razorpay checkout');
           openRazorpay({
             key: orderData.keyId,
             amount: orderData.amount,
             currency: orderData.currency,
             name: 'WanderSphere',
             description: purpose === 'wallet' ? 'Add money to wallet' : 'Trip payment',
             order_id: orderData.orderId,
             handler: async (response: any) => {
               try {
                 // Step 3: Verify payment
                 const verifyData = await this.verifyPayment({
                   razorpay_order_id: response.razorpay_order_id,
                   razorpay_payment_id: response.razorpay_payment_id,
                   razorpay_signature: response.razorpay_signature,
                   amount: orderData.amount!,
                   purpose,
                   tripId,
                 });

                 if (onSuccess) {
                   onSuccess(verifyData);
                 }
               } catch (error) {
                 console.error('Payment verification failed:', error);
                 if (onFailure) {
                   onFailure(error instanceof Error ? error : new Error('Payment verification failed'));
                 }
               }
             },
             prefill: userDetails,
             theme: {
               color: '#667eea', // Brand color
             },
             config: {
               display: {
                 language: 'en',
                 hide: [],
                 preferences: {
                   show_default_blocks: true
                 }
               }
             },
             modal: {
               ondismiss: () => {
                 console.log('Payment modal closed');
                 if (onFailure) {
                   onFailure(new Error('Payment cancelled by user'));
                 }
               },
             },
           });
         }
       }

    } catch (error) {
      console.error('Process payment error:', error);
      if (onFailure) {
        onFailure(error instanceof Error ? error : new Error('Payment process failed'));
      }
    }
  }
}

export const paymentService = new PaymentService();

import { apiRequest } from '../utils/api';
import { apiConfig } from '../config/api';

export interface CreateOrderRequest {
  amount: number; // Amount in rupees
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number; // Amount in paise
  currency: string;
  keyId: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number; // Amount in paise
  purpose: 'wallet' | 'trip';
  tripId?: string;
}

export interface VerifyPaymentResponse {
  newBalance?: number;
  amountAdded?: number;
  amountPaid?: number;
  tripId?: string;
  transactionId: string;
}

export interface PayFromWalletRequest {
  tripId: string;
  amount: number;
}

export interface PayFromWalletResponse {
  newBalance: number;
  amountPaid: number;
  tripId: string;
}

/**
 * Payment Service - Handles all payment-related API calls
 */
class PaymentService {
  /**
   * Create a Razorpay order
   * 
   * @param data - Order creation data
   * @returns Order details including orderId and keyId
   * 
   * @example
   * ```typescript
   * const orderData = await paymentService.createOrder({
   *   amount: 500, // ₹500
   *   currency: 'INR'
   * });
   * ```
   */
  async createOrder(data: CreateOrderRequest) {
    try {
      const response = await apiRequest<any>(
        `${apiConfig.baseURL}/payment/create-order`,
        {
          method: 'POST',
          body: data,
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to create order');
      }

      return response.data as CreateOrderResponse;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment and update wallet/booking
   * 
   * @param data - Payment verification data
   * @returns Updated balance or booking details
   * 
   * @example
   * ```typescript
   * // For wallet
   * await paymentService.verifyPayment({
   *   razorpay_order_id: '...',
   *   razorpay_payment_id: '...',
   *   razorpay_signature: '...',
   *   amount: 50000, // ₹500 in paise
   *   purpose: 'wallet'
   * });
   * 
   * // For trip
   * await paymentService.verifyPayment({
   *   ...paymentData,
   *   purpose: 'trip',
   *   tripId: 'trip_123'
   * });
   * ```
   */
  async verifyPayment(data: VerifyPaymentRequest) {
    try {
      const response = await apiRequest<any>(
        `${apiConfig.baseURL}/payment/verify`,
        {
          method: 'POST',
          body: data,
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Payment verification failed');
      }

      return response.data as VerifyPaymentResponse;
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error;
    }
  }

  /**
   * Pay for a trip using wallet balance
   * 
   * @param data - Payment data
   * @returns Updated wallet balance
   * 
   * @example
   * ```typescript
   * const result = await paymentService.payFromWallet({
   *   tripId: 'trip_123',
   *   amount: 1500 // ₹1500
   * });
   * 
   * console.log('New balance:', result.newBalance);
   * ```
   */
  async payFromWallet(data: PayFromWalletRequest) {
    try {
      const response = await apiRequest<any>(
        `${apiConfig.baseURL}/payment/pay-from-wallet`,
        {
          method: 'POST',
          body: data,
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Wallet payment failed');
      }

      return response.data as PayFromWalletResponse;
    } catch (error) {
      console.error('Pay from wallet error:', error);
      throw error;
    }
  }

  /**
   * Complete payment flow: Create order → Open Razorpay → Verify
   * 
   * @param amount - Amount in rupees
   * @param purpose - 'wallet' or 'trip'
   * @param tripId - Required if purpose is 'trip'
   * @param openRazorpay - Function from useRazorpay hook
   * @param onSuccess - Callback on successful payment
   * @param onFailure - Callback on payment failure
   * 
   * @example
   * ```typescript
   * const { openRazorpay, isLoaded } = useRazorpay();
   * 
   * if (isLoaded) {
   *   await paymentService.processPayment(
   *     500,
   *     'wallet',
   *     undefined,
   *     openRazorpay,
   *     (result) => {
   *       toast({ title: 'Success', description: `Added ₹${result.amountAdded}` });
   *     },
   *     (error) => {
   *       toast({ title: 'Error', description: error.message, variant: 'destructive' });
   *     }
   *   );
   * }
   * ```
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

      // Step 2: Open Razorpay checkout
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
              amount: orderData.amount,
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
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
            if (onFailure) {
              onFailure(new Error('Payment cancelled by user'));
            }
          },
        },
      });
    } catch (error) {
      console.error('Process payment error:', error);
      if (onFailure) {
        onFailure(error instanceof Error ? error : new Error('Payment process failed'));
      }
    }
  }
}

export const paymentService = new PaymentService();

/**
 * Wallet Service
 * Handles wallet operations including balance, transactions, deposits, and withdrawals
 */

import { supabase } from '@/config/supabase';
import { apiRequest } from '@/utils/api';
import { buildUrl, getAuthHeader, ApiResponse } from '@/config/api';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'deposit' | 'booking_payment' | 'refund' | 'withdrawal' | 'cashback';
  amount: number;
  description: string | null;
  reference_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface WalletDetails {
  wallet: Wallet;
  transactions: WalletTransaction[];
  recentTransactions: WalletTransaction[];
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

class WalletService {
  /**
   * Get wallet details including balance and recent transactions
   */
  async getWalletDetails(userId: string): Promise<WalletDetails> {
    try {
      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is okay - wallet will be created on first transaction
        throw new Error(walletError.message || 'Failed to fetch wallet');
      }

      // If wallet doesn't exist, create it with zero balance
      let walletData: Wallet;
      if (!wallet) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            balance: 0,
            currency: 'INR'
          })
          .select()
          .single();

        if (createError) {
          throw new Error(createError.message || 'Failed to create wallet');
        }

        walletData = newWallet;
      } else {
        walletData = wallet;
      }

      // Get transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        // Don't throw - return empty transactions array
      }

      return {
        wallet: walletData,
        transactions: transactions || [],
        recentTransactions: (transactions || []).slice(0, 10)
      };
    } catch (error: any) {
      console.error('Error getting wallet details:', error);
      throw new Error(error.message || 'Failed to get wallet details');
    }
  }

  /**
   * Add funds to wallet via Razorpay
   * Step 1: Create Razorpay order
   * Step 2: On payment success, call Supabase RPC function to process transaction
   */
  async addFunds(amount: number): Promise<{ orderId: string; razorpayOrder: RazorpayOrder }> {
    try {
      // Get current user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('Please log in to add funds');
      }

      // Validate amount
      if (amount <= 0 || amount < 100) {
        throw new Error('Minimum amount is ₹100');
      }

      // Create Razorpay order via backend
      const authHeaders = await getAuthHeader();
      const { endpoints } = await import('@/config/api');
      const response = await apiRequest<ApiResponse<RazorpayOrder>>(
        buildUrl(endpoints.wallet.createOrder),
        {
          method: 'POST',
          headers: authHeaders,
          body: {
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `wallet_${session.user.id}_${Date.now()}`
          }
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create payment order');
      }

      return {
        orderId: response.data.id,
        razorpayOrder: response.data
      };
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      throw new Error(error.message || 'Failed to create payment order');
    }
  }

  /**
   * Process wallet transaction after Razorpay payment success
   * This is called after Razorpay payment is successful
   */
  async processDeposit(amount: number, razorpayPaymentId: string, razorpayOrderId: string): Promise<WalletDetails> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('Please log in to process payment');
      }

      // Call Supabase RPC function to process wallet transaction
      const { data, error } = await supabase.rpc('process_wallet_transaction', {
        p_user_id: session.user.id,
        p_amount: amount,
        p_type: 'deposit',
        p_description: `Wallet deposit via Razorpay`,
        p_reference_id: razorpayPaymentId
      });

      if (error) {
        throw new Error(error.message || 'Failed to process wallet transaction');
      }

      if (!data || !data.success) {
        throw new Error('Transaction failed');
      }

      // Refresh wallet details
      return await this.getWalletDetails(session.user.id);
    } catch (error: any) {
      console.error('Error processing deposit:', error);
      throw new Error(error.message || 'Failed to process deposit');
    }
  }

  /**
   * Process trip payment using wallet balance first, then Razorpay for remainder
   * Returns: { walletAmountUsed, razorpayAmount, needsRazorpay }
   */
  async processTripPayment(tripAmount: number): Promise<{
    walletAmountUsed: number;
    razorpayAmount: number;
    needsRazorpay: boolean;
    walletBalance: number;
  }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('Please log in to process payment');
      }

      // Get current wallet balance
      const walletDetails = await this.getWalletDetails(session.user.id);
      const walletBalance = walletDetails.wallet.balance;

      // Calculate payment split
      const walletAmountUsed = Math.min(walletBalance, tripAmount);
      const razorpayAmount = Math.max(0, tripAmount - walletBalance);
      const needsRazorpay = razorpayAmount > 0;

      return {
        walletAmountUsed,
        razorpayAmount,
        needsRazorpay,
        walletBalance
      };
    } catch (error: any) {
      console.error('Error processing trip payment:', error);
      throw new Error(error.message || 'Failed to process trip payment');
    }
  }

  /**
   * Deduct amount from wallet for trip payment
   */
  async deductForTrip(amount: number, tripId: string, description?: string): Promise<WalletDetails> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('Please log in to process payment');
      }

      // Call Supabase RPC function to process wallet transaction
      const { data, error } = await supabase.rpc('process_wallet_transaction', {
        p_user_id: session.user.id,
        p_amount: -amount, // Negative for deduction
        p_type: 'booking_payment',
        p_description: description || `Trip payment for trip ${tripId}`,
        p_reference_id: `trip_${tripId}_${Date.now()}`
      });

      if (error) {
        throw new Error(error.message || 'Failed to process wallet transaction');
      }

      if (!data || !data.success) {
        throw new Error('Transaction failed');
      }

      // Refresh wallet details
      return await this.getWalletDetails(session.user.id);
    } catch (error: any) {
      console.error('Error deducting for trip:', error);
      throw new Error(error.message || 'Failed to deduct from wallet');
    }
  }

  /**
   * Request withdrawal from wallet
   * Note: This is a closed loop system - actual payout must be done manually
   */
  async requestWithdrawal(amount: number): Promise<WalletDetails> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('Please log in to request withdrawal');
      }

      // Validate amount
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      // Get current wallet balance
      const walletDetails = await this.getWalletDetails(session.user.id);
      
      if (walletDetails.wallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Call Supabase RPC function to process withdrawal
      const { data, error } = await supabase.rpc('process_wallet_transaction', {
        p_user_id: session.user.id,
        p_amount: -amount, // Negative for withdrawal
        p_type: 'withdrawal',
        p_description: `Withdrawal request - Contact support for payout`,
        p_reference_id: `withdrawal_${Date.now()}`
      });

      if (error) {
        throw new Error(error.message || 'Failed to process withdrawal');
      }

      if (!data || !data.success) {
        throw new Error('Withdrawal request failed');
      }

      // Refresh wallet details
      return await this.getWalletDetails(session.user.id);
    } catch (error: any) {
      console.error('Error processing withdrawal:', error);
      throw new Error(error.message || 'Failed to process withdrawal');
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;


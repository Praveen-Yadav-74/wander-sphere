-- ============================================
-- WanderSphere Wallet System Migration
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This creates all tables, RLS policies, and functions for the wallet system
-- ============================================

-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance NUMERIC DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'INR',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Transaction Ledger
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'booking_payment', 'refund', 'withdrawal', 'cashback')),
  amount NUMERIC NOT NULL, 
  description TEXT,
  reference_id TEXT, -- Razorpay Payment ID or PNR
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);

-- 4. Enable Row Level Security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Wallets
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;

-- Create policies
CREATE POLICY "Users view own wallet" 
  ON public.wallets 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" 
  ON public.wallets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" 
  ON public.wallets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 6. RLS Policies for Wallet Transactions
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;

-- Create policies
CREATE POLICY "Users view own transactions" 
  ON public.wallet_transactions 
  FOR SELECT 
  USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own transactions" 
  ON public.wallet_transactions 
  FOR INSERT 
  WITH CHECK (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

-- 7. Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger to update updated_at on wallet balance changes
DROP TRIGGER IF EXISTS trigger_update_wallet_updated_at ON public.wallets;
CREATE TRIGGER trigger_update_wallet_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  WHEN (OLD.balance IS DISTINCT FROM NEW.balance)
  EXECUTE FUNCTION public.update_wallet_updated_at();

-- 9. Secure Transaction Function
-- This function handles all wallet transactions atomically
CREATE OR REPLACE FUNCTION public.process_wallet_transaction(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_description TEXT,
  p_reference_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Validate transaction type
  IF p_type NOT IN ('deposit', 'booking_payment', 'refund', 'withdrawal', 'cashback') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_type;
  END IF;

  -- Get or Create Wallet with Lock (FOR UPDATE ensures row-level locking)
  SELECT id, balance INTO v_wallet_id, v_current_balance 
  FROM public.wallets 
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If wallet doesn't exist, create it
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance, currency) 
    VALUES (p_user_id, 0, 'INR')
    RETURNING id, balance INTO v_wallet_id, v_current_balance;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Validate balance (cannot go negative)
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient Wallet Balance. Current: %, Requested: %', v_current_balance, ABS(p_amount);
  END IF;

  -- Update wallet balance
  UPDATE public.wallets 
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;

  -- Insert transaction record
  INSERT INTO public.wallet_transactions (
    wallet_id, 
    type, 
    amount, 
    description, 
    reference_id,
    status
  )
  VALUES (
    v_wallet_id, 
    p_type, 
    p_amount, 
    p_description, 
    p_reference_id,
    CASE 
      WHEN p_type = 'withdrawal' THEN 'pending'
      ELSE 'completed'
    END
  )
  RETURNING id INTO v_transaction_id;

  -- Return success response
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'previous_balance', v_current_balance
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_wallet_transaction TO authenticated;

-- 11. Create a function to get wallet summary (optional helper)
CREATE OR REPLACE FUNCTION public.get_wallet_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_wallet RECORD;
  v_transaction_count INTEGER;
  v_total_deposits NUMERIC := 0;
  v_total_withdrawals NUMERIC := 0;
BEGIN
  -- Get wallet
  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = p_user_id;

  IF v_wallet IS NULL THEN
    RETURN json_build_object(
      'wallet', NULL,
      'transaction_count', 0,
      'total_deposits', 0,
      'total_withdrawals', 0
    );
  END IF;

  -- Get transaction counts and totals
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)
  INTO v_transaction_count, v_total_deposits, v_total_withdrawals
  FROM public.wallet_transactions
  WHERE wallet_id = v_wallet.id;

  RETURN json_build_object(
    'wallet', json_build_object(
      'id', v_wallet.id,
      'user_id', v_wallet.user_id,
      'balance', v_wallet.balance,
      'currency', v_wallet.currency,
      'updated_at', v_wallet.updated_at
    ),
    'transaction_count', v_transaction_count,
    'total_deposits', v_total_deposits,
    'total_withdrawals', v_total_withdrawals
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_wallet_summary TO authenticated;

-- ============================================
-- Migration Complete!
-- ============================================
-- The wallet system is now ready to use.
-- Test by calling: SELECT public.process_wallet_transaction(user_id, 100, 'deposit', 'Test deposit', 'test_ref_123');
-- ============================================


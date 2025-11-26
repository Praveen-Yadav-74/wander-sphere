-- =============================================
-- COMPLETE BUDGET FEATURES MIGRATION
-- =============================================
-- This script adds all required features for the Budget section:
-- 1. Status column for trips (Complete/Reopen)
-- 2. Budget limit and currency columns for trips
-- 3. Expenses table with user_id for RLS
-- 4. Date columns for budgets
-- 5. Complete RLS policies
-- =============================================

-- =============================================
-- STEP 1: Update Trips Table
-- =============================================

-- Add status column if it doesn't exist (for Complete/Reopen feature)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trips' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.trips 
        ADD COLUMN status TEXT DEFAULT 'active';
        
        -- Update existing rows
        UPDATE public.trips 
        SET status = 'active' 
        WHERE status IS NULL;
    END IF;
END $$;

-- Add budget_limit column to trips if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trips' 
        AND column_name = 'budget_limit'
    ) THEN
        ALTER TABLE public.trips 
        ADD COLUMN budget_limit DECIMAL(12,2);
    END IF;
END $$;

-- Add currency column to trips if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trips' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.trips 
        ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
    END IF;
END $$;

-- =============================================
-- STEP 2: Update Budgets Table
-- =============================================

-- Add spent_amount column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'budgets' 
        AND column_name = 'spent_amount'
    ) THEN
        ALTER TABLE public.budgets 
        ADD COLUMN spent_amount DECIMAL(12,2) DEFAULT 0;
        
        -- Initialize spent_amount for existing budgets
        UPDATE public.budgets 
        SET spent_amount = 0 
        WHERE spent_amount IS NULL;
    END IF;
END $$;

-- Add start_date column to budgets if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'budgets' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE public.budgets 
        ADD COLUMN start_date DATE;
    END IF;
END $$;

-- Add end_date column to budgets if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'budgets' 
        AND column_name = 'end_date'
    ) THEN
        ALTER TABLE public.budgets 
        ADD COLUMN end_date DATE;
    END IF;
END $$;

-- Update status column constraint if needed
DO $$ 
BEGIN
    -- Drop existing constraint if it exists and doesn't match
    ALTER TABLE public.budgets 
    DROP CONSTRAINT IF EXISTS budgets_status_check;
    
    -- Add new constraint with 'active' and 'completed'
    ALTER TABLE public.budgets 
    ADD CONSTRAINT budgets_status_check 
    CHECK (status IN ('active', 'completed', 'exceeded'));
END $$;

-- =============================================
-- STEP 3: Create Expenses Table (Primary Table)
-- =============================================

-- Create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_trip ON public.expenses(user_id, trip_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON public.expenses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_expenses_updated_at();

-- =============================================
-- STEP 4: Enable RLS on Expenses Table
-- =============================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users manage own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

-- Create comprehensive RLS policies for expenses
-- Users can view their own expenses
CREATE POLICY "Users can view their own expenses" ON public.expenses
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own expenses (with user_id check)
CREATE POLICY "Users can create their own expenses" ON public.expenses
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own expenses
CREATE POLICY "Users can update their own expenses" ON public.expenses
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own expenses
CREATE POLICY "Users can delete their own expenses" ON public.expenses
    FOR DELETE 
    USING (auth.uid() = user_id);

-- =============================================
-- STEP 5: Ensure Budgets Table RLS is Correct
-- =============================================

-- Enable RLS on budgets if not already enabled
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Drop and recreate budgets policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

-- Users can view their own budgets
CREATE POLICY "Users can view their own budgets" ON public.budgets
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can create their own budgets
CREATE POLICY "Users can create their own budgets" ON public.budgets
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own budgets
CREATE POLICY "Users can update their own budgets" ON public.budgets
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own budgets
CREATE POLICY "Users can delete their own budgets" ON public.budgets
    FOR DELETE 
    USING (auth.uid() = user_id);

-- =============================================
-- STEP 6: Ensure Trips Table RLS is Correct
-- =============================================

-- Enable RLS on trips if not already enabled
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Drop and recreate trips policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can create their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON public.trips;

-- Users can view their own trips
CREATE POLICY "Users can view their own trips" ON public.trips
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can create their own trips
CREATE POLICY "Users can create their own trips" ON public.trips
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own trips
CREATE POLICY "Users can update their own trips" ON public.trips
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own trips
CREATE POLICY "Users can delete their own trips" ON public.trips
    FOR DELETE 
    USING (auth.uid() = user_id);

-- =============================================
-- STEP 7: Create Helper Function to Sync Budget Dates
-- =============================================

-- Function to sync budget dates from trip when trip dates are updated
CREATE OR REPLACE FUNCTION sync_budget_dates_from_trip()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all budgets linked to this trip with the new dates
    UPDATE public.budgets
    SET 
        start_date = NEW.start_date,
        end_date = NEW.end_date,
        updated_at = NOW()
    WHERE trip_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync dates when trip dates change
DROP TRIGGER IF EXISTS sync_budget_dates_trigger ON public.trips;
CREATE TRIGGER sync_budget_dates_trigger
    AFTER UPDATE OF start_date, end_date ON public.trips
    FOR EACH ROW
    WHEN (OLD.start_date IS DISTINCT FROM NEW.start_date OR OLD.end_date IS DISTINCT FROM NEW.end_date)
    EXECUTE FUNCTION sync_budget_dates_from_trip();

-- =============================================
-- STEP 8: Create Helper Function to Calculate Budget Spent
-- =============================================

-- Function to recalculate spent_amount from expenses
CREATE OR REPLACE FUNCTION recalculate_budget_spent(budget_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    total_spent DECIMAL(12,2);
    budget_trip_id UUID;
BEGIN
    -- Get the trip_id for this budget
    SELECT trip_id INTO budget_trip_id
    FROM public.budgets
    WHERE id = budget_uuid;
    
    -- Calculate total from expenses table
    SELECT COALESCE(SUM(amount), 0) INTO total_spent
    FROM public.expenses
    WHERE trip_id = budget_trip_id;
    
    -- Update the budget's spent_amount
    UPDATE public.budgets
    SET spent_amount = total_spent
    WHERE id = budget_uuid;
    
    RETURN total_spent;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 9: Create Trigger to Auto-Update Budget Spent
-- =============================================

-- Function to update budget spent_amount when expense is added/updated/deleted
CREATE OR REPLACE FUNCTION update_budget_spent_on_expense_change()
RETURNS TRIGGER AS $$
DECLARE
    affected_trip_id UUID;
    new_spent DECIMAL(12,2);
BEGIN
    -- Determine trip_id based on operation
    IF TG_OP = 'DELETE' THEN
        affected_trip_id := OLD.trip_id;
    ELSE
        affected_trip_id := NEW.trip_id;
    END IF;
    
    -- Only update if trip_id exists
    IF affected_trip_id IS NOT NULL THEN
        -- Calculate new total spent
        SELECT COALESCE(SUM(amount), 0) INTO new_spent
        FROM public.expenses
        WHERE trip_id = affected_trip_id;
        
        -- Update all budgets linked to this trip
        UPDATE public.budgets
        SET 
            spent_amount = new_spent,
            updated_at = NOW()
        WHERE trip_id = affected_trip_id;
    END IF;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for expense changes
DROP TRIGGER IF EXISTS update_budget_on_expense_insert ON public.expenses;
CREATE TRIGGER update_budget_on_expense_insert
    AFTER INSERT ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_spent_on_expense_change();

DROP TRIGGER IF EXISTS update_budget_on_expense_update ON public.expenses;
CREATE TRIGGER update_budget_on_expense_update
    AFTER UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_spent_on_expense_change();

DROP TRIGGER IF EXISTS update_budget_on_expense_delete ON public.expenses;
CREATE TRIGGER update_budget_on_expense_delete
    AFTER DELETE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_spent_on_expense_change();

-- =============================================
-- STEP 10: Migrate Existing Data (if any)
-- =============================================

-- If budget_expenses table exists, migrate data to expenses table
DO $$
DECLARE
    expense_record RECORD;
    budget_trip_id UUID;
BEGIN
    -- Check if budget_expenses table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'budget_expenses'
    ) THEN
        -- Migrate each budget_expense to expenses table
        FOR expense_record IN 
            SELECT be.*, b.user_id, b.trip_id
            FROM public.budget_expenses be
            JOIN public.budgets b ON be.budget_id = b.id
            WHERE NOT EXISTS (
                SELECT 1 FROM public.expenses e
                WHERE e.trip_id = b.trip_id
                AND e.category = be.category
                AND e.amount = be.amount
                AND e.date = be.expense_date
            )
        LOOP
            -- Insert into expenses table
            INSERT INTO public.expenses (
                trip_id,
                user_id,
                category,
                amount,
                description,
                date,
                currency,
                created_at,
                updated_at
            )
            VALUES (
                expense_record.trip_id,
                expense_record.user_id,
                expense_record.category,
                expense_record.amount,
                expense_record.description,
                expense_record.expense_date,
                'USD', -- Default currency
                expense_record.created_at,
                expense_record.updated_at
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- =============================================
-- STEP 11: Sync Existing Budget Dates from Trips
-- =============================================

-- Update budgets with dates from their linked trips
UPDATE public.budgets b
SET 
    start_date = t.start_date,
    end_date = t.end_date,
    updated_at = NOW()
FROM public.trips t
WHERE b.trip_id = t.id
AND (b.start_date IS NULL OR b.end_date IS NULL);

-- =============================================
-- STEP 12: Recalculate Spent Amounts for All Budgets
-- =============================================

-- Recalculate spent_amount for all budgets based on expenses
DO $$
DECLARE
    budget_record RECORD;
    calculated_spent DECIMAL(12,2);
BEGIN
    FOR budget_record IN 
        SELECT id, trip_id FROM public.budgets WHERE trip_id IS NOT NULL
    LOOP
        -- Calculate spent from expenses
        SELECT COALESCE(SUM(amount), 0) INTO calculated_spent
        FROM public.expenses
        WHERE trip_id = budget_record.trip_id;
        
        -- Update budget
        UPDATE public.budgets
        SET spent_amount = calculated_spent
        WHERE id = budget_record.id;
    END LOOP;
END $$;

-- =============================================
-- VERIFICATION QUERIES (Optional - Run to verify)
-- =============================================

-- Check trips table structure
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'trips'
-- ORDER BY ordinal_position;

-- Check budgets table structure
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'budgets'
-- ORDER BY ordinal_position;

-- Check expenses table structure
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'expenses'
-- ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('expenses', 'budgets', 'trips')
-- ORDER BY tablename, policyname;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- All features are now available:
-- ✓ Status column on trips (for Complete/Reopen)
-- ✓ Budget limit and currency on trips
-- ✓ Expenses table with user_id (for RLS)
-- ✓ Date columns on budgets
-- ✓ Complete RLS policies
-- ✓ Auto-sync triggers
-- =============================================


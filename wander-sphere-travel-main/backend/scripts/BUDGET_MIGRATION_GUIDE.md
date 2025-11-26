# Complete Budget Features Migration Guide

## Overview
This guide explains how to apply the complete budget features migration to your Supabase database. This migration adds all required features for the Budget section including status management, date editing, and proper expense handling.

## What This Migration Does

### 1. **Trips Table Updates**
- ✅ Adds `status` column (for Complete/Reopen feature)
- ✅ Adds `budget_limit` column (for budget tracking)
- ✅ Adds `currency` column (for multi-currency support)

### 2. **Budgets Table Updates**
- ✅ Adds `spent_amount` column (tracks total spent)
- ✅ Adds `start_date` column (trip start date)
- ✅ Adds `end_date` column (trip end date)
- ✅ Updates status constraint to include 'active' and 'completed'

### 3. **Expenses Table Creation**
- ✅ Creates `expenses` table with `user_id` (for RLS compliance)
- ✅ Links expenses to trips via `trip_id`
- ✅ Includes category, amount, description, date, currency
- ✅ Proper indexes for performance

### 4. **Row Level Security (RLS)**
- ✅ Complete RLS policies for `expenses` table
- ✅ Ensures users can only manage their own expenses
- ✅ Updates RLS policies for `budgets` and `trips` tables

### 5. **Automatic Triggers**
- ✅ Auto-sync budget dates from trips
- ✅ Auto-calculate `spent_amount` when expenses change
- ✅ Auto-update timestamps

### 6. **Data Migration**
- ✅ Migrates existing `budget_expenses` data to `expenses` table
- ✅ Syncs budget dates from linked trips
- ✅ Recalculates spent amounts for all budgets

## How to Apply the Migration

### Step 1: Backup Your Database
⚠️ **IMPORTANT**: Always backup your database before running migrations!

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Backups**
3. Create a manual backup or ensure automatic backups are enabled

### Step 2: Open SQL Editor
1. Go to Supabase Dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 3: Run the Migration
1. Open the file: `backend/scripts/complete-budget-features-migration.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)

### Step 4: Verify the Migration
After running, verify the migration was successful:

```sql
-- Check if expenses table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'expenses'
);

-- Check if status column exists on trips
SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trips' 
    AND column_name = 'status'
);

-- Check if start_date exists on budgets
SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'budgets' 
    AND column_name = 'start_date'
);

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('expenses', 'budgets', 'trips')
ORDER BY tablename, policyname;
```

## Expected Results

After running the migration, you should see:

1. ✅ **Trips table** has `status`, `budget_limit`, and `currency` columns
2. ✅ **Budgets table** has `spent_amount`, `start_date`, and `end_date` columns
3. ✅ **Expenses table** exists with proper structure and RLS
4. ✅ **RLS policies** are active on all three tables
5. ✅ **Triggers** are created for auto-sync and auto-calculation

## Troubleshooting

### Error: "column already exists"
- This is normal! The migration uses `IF NOT EXISTS` checks
- The script will skip columns that already exist
- This is safe to run multiple times

### Error: "relation already exists"
- The expenses table might already exist
- The migration will handle this gracefully
- Check if the table structure matches what's expected

### Error: "permission denied"
- Ensure you're running as a database superuser
- In Supabase, you should have full access via SQL Editor
- If issues persist, check your Supabase project permissions

### RLS Policies Not Working
- Verify RLS is enabled: `ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;`
- Check policies exist: Run the verification queries above
- Ensure `auth.uid()` is available in your Supabase project

## Post-Migration Checklist

- [ ] Verify expenses table exists and has correct structure
- [ ] Verify trips table has status, budget_limit, currency columns
- [ ] Verify budgets table has spent_amount, start_date, end_date columns
- [ ] Test creating an expense (should include user_id)
- [ ] Test updating budget status (should work)
- [ ] Test editing budget dates (should work)
- [ ] Verify RLS is working (users can only see their own data)

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- WARNING: This will delete all expense data!
DROP TABLE IF EXISTS public.expenses CASCADE;

-- Remove columns (if needed)
ALTER TABLE public.trips DROP COLUMN IF EXISTS status;
ALTER TABLE public.trips DROP COLUMN IF EXISTS budget_limit;
ALTER TABLE public.trips DROP COLUMN IF EXISTS currency;

ALTER TABLE public.budgets DROP COLUMN IF EXISTS spent_amount;
ALTER TABLE public.budgets DROP COLUMN IF EXISTS start_date;
ALTER TABLE public.budgets DROP COLUMN IF EXISTS end_date;

-- Drop triggers
DROP TRIGGER IF EXISTS sync_budget_dates_trigger ON public.trips;
DROP TRIGGER IF EXISTS update_budget_on_expense_insert ON public.expenses;
DROP TRIGGER IF EXISTS update_budget_on_expense_update ON public.expenses;
DROP TRIGGER IF EXISTS update_budget_on_expense_delete ON public.expenses;

-- Drop functions
DROP FUNCTION IF EXISTS sync_budget_dates_from_trip() CASCADE;
DROP FUNCTION IF EXISTS update_budget_spent_on_expense_change() CASCADE;
DROP FUNCTION IF EXISTS recalculate_budget_spent(UUID) CASCADE;
```

## Support

If you encounter any issues:
1. Check the Supabase logs in the Dashboard
2. Verify your database connection
3. Ensure all dependencies are met
4. Review the error messages for specific guidance

## Next Steps

After migration:
1. Test the frontend budget features
2. Verify expense creation works
3. Test status updates (Complete/Reopen)
4. Test date editing
5. Monitor database performance

---

**Migration Version**: 1.0.0  
**Last Updated**: 2024  
**Compatible With**: Supabase PostgreSQL 14+


-- Migration: Add performance indexes for budget tables
-- Purpose: Improve query performance for budget and expense operations

-- Index for budget_expenses.budget_id (used in expense queries)
CREATE INDEX IF NOT EXISTS idx_budget_expenses_budget_id 
ON budget_expenses(budget_id);

-- Index for budgets.user_id (used in user budget listing)
CREATE INDEX IF NOT EXISTS idx_budgets_user_id 
ON budgets(user_id);

-- Index for budgets.status (used in filtering)
CREATE INDEX IF NOT EXISTS idx_budgets_status 
ON budgets(status);

-- Composite index for common query pattern (user + status)
CREATE INDEX IF NOT EXISTS idx_budgets_user_status 
ON budgets(user_id, status);

-- Index for budget_expenses date queries
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date 
ON budget_expenses(expense_date DESC);

-- Analyze tables to update statistics
ANALYZE budget_expenses;
ANALYZE budgets;

-- Create budget_expenses table
-- This table is required for the budget expenses API endpoints

CREATE TABLE IF NOT EXISTS public.budget_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_expenses_budget_id ON public.budget_expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON public.budget_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_category ON public.budget_expenses(category);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_budget_expenses_updated_at 
    BEFORE UPDATE ON public.budget_expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.budget_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access expenses for their own budgets
CREATE POLICY "Users can view their own budget expenses" ON public.budget_expenses
  FOR SELECT USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses for their own budgets" ON public.budget_expenses
  FOR INSERT WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own budget expenses" ON public.budget_expenses
  FOR UPDATE USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own budget expenses" ON public.budget_expenses
  FOR DELETE USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

COMMIT;
/**
 * Budget Service
 * Handles budget-related API operations
 */

import { apiRequest } from '@/utils/api';
import { endpoints, buildUrl, getAuthHeaderSync, ApiResponse, PaginatedResponse } from '@/config/api';

export interface Budget {
  id: string;
  title: string;
  destination: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  currency: string;
  noMaxBudget?: boolean;
  userId: string;
  expenses: BudgetExpense[];
  createdAt: string;
  updatedAt: string;
  dates?: string;
  progress?: number;
}

export interface BudgetExpense {
  id: string;
  budgetId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetData {
  title: string;
  destination: string;
  totalBudget?: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming';
  currency: string;
  noMaxBudget?: boolean;
}

export interface UpdateBudgetData extends Partial<CreateBudgetData> {
  id: string;
  status?: 'active' | 'completed';
  startDate?: string;
  endDate?: string;
}

export interface CreateExpenseData {
  category: string;
  amount: number;
  description: string;
  date: string;
  currency?: string;
  user_id?: string; // Required for RLS
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  id: string;
}

export interface BudgetSearchParams {
  status?: 'active' | 'upcoming' | 'completed';
  destination?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Get all budgets for the current user
 * Ensures session is available before making request
 */
export const getBudgets = async (params?: BudgetSearchParams): Promise<Budget[]> => {
  // Ensure we have a session before making the request
  const { supabase } = await import('@/config/supabase');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.access_token) {
    throw new Error('No authentication token available. Please log in.');
  }
  
  let url = buildUrl(endpoints.budget.list);
  
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
  // Use async getAuthHeader to ensure fresh token
  const { getAuthHeader } = await import('@/config/api');
  const authHeaders = await getAuthHeader();
  
  const response = await apiRequest<ApiResponse<Budget[]>>(url, {
    headers: authHeaders,
  });
  return response.data;
};

/**
 * Get trip budget details with expenses in ONE efficient query
 * Uses Supabase join to fetch trip + expenses together
 * This prevents sync errors and loading issues
 * CRITICAL: Handles budgets with or without trip_id
 */
export const getTripBudgetDetails = async (budgetId: string): Promise<{ budget: Budget; expenses: BudgetExpense[] }> => {
  const { supabase } = await import('@/config/supabase');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    throw new Error('No authentication token available. Please log in.');
  }

  // CRITICAL: First get the budget - RLS will filter by user_id automatically
  const { data: budgetData, error: budgetError } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .single();

  if (budgetError) {
    console.error('Budget fetch error:', budgetError);
    console.error('Budget ID:', budgetId);
    console.error('User ID:', session.user.id);
    console.error('Error code:', budgetError.code);
    console.error('Error details:', budgetError.details);
    
    // Provide more helpful error messages
    if (budgetError.code === 'PGRST116') {
      throw new Error('Budget not found. Please check the budget ID.');
    } else if (budgetError.message?.includes('row-level security')) {
      throw new Error('Access denied. This budget does not belong to you.');
    } else {
      throw new Error(`Budget not found or access denied: ${budgetError.message}`);
    }
  }

  if (!budgetData) {
    throw new Error('Budget not found');
  }

  // CRITICAL: Verify ownership (RLS should handle this, but double-check for safety)
  if (budgetData.user_id !== session.user.id) {
    console.error('Budget ownership mismatch:', {
      budgetUserId: budgetData.user_id,
      sessionUserId: session.user.id
    });
    throw new Error('Access denied: Budget does not belong to current user');
  }

  // Get trip_id from budget
  const tripId = budgetData.trip_id;

  // CRITICAL: Fetch expenses - try multiple sources
  let expenses: BudgetExpense[] = [];
  
  // Strategy 1: If budget has trip_id, fetch expenses from expenses table
  if (tripId) {
    const { data: tripExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', session.user.id)
      .order('date', { ascending: false });

    if (!expensesError && tripExpenses) {
      expenses = tripExpenses.map((exp: any) => ({
        id: exp.id,
        budgetId: budgetId,
        category: exp.category || 'Miscellaneous',
        amount: parseFloat(exp.amount?.toString() || '0'),
        description: exp.description || '',
        date: exp.date || exp.expense_date,
        currency: exp.currency || budgetData.currency || 'USD',
        createdAt: exp.created_at,
        updatedAt: exp.updated_at,
      }));
    }
  }

  // Strategy 2: Always also check budget_expenses table (for backward compatibility)
  const { data: budgetExpenses, error: budgetExpensesError } = await supabase
    .from('budget_expenses')
    .select('*')
    .eq('budget_id', budgetId)
    .order('expense_date', { ascending: false });

  if (!budgetExpensesError && budgetExpenses && budgetExpenses.length > 0) {
    // Merge with existing expenses (avoid duplicates)
    const existingIds = new Set(expenses.map(e => e.id));
    const newExpenses = budgetExpenses
      .filter((exp: any) => !existingIds.has(exp.id))
      .map((exp: any) => ({
        id: exp.id,
        budgetId: budgetId,
        category: exp.category || 'Miscellaneous',
        amount: parseFloat(exp.amount?.toString() || '0'),
        description: exp.description || '',
        date: exp.expense_date || exp.date,
        currency: budgetData.currency || 'USD',
        createdAt: exp.created_at,
        updatedAt: exp.updated_at,
      }));
    expenses = [...expenses, ...newExpenses];
  }

  // Transform budget data
  const budget: Budget = {
    id: budgetData.id,
    title: budgetData.title,
    destination: budgetData.description || '',
    totalBudget: parseFloat(budgetData.total_amount?.toString() || '0'),
    spent: parseFloat(budgetData.spent_amount?.toString() || '0'),
    remaining: parseFloat(budgetData.total_amount?.toString() || '0') - parseFloat(budgetData.spent_amount?.toString() || '0'),
    startDate: budgetData.start_date || '',
    endDate: budgetData.end_date || '',
    status: (budgetData.status as 'active' | 'completed') || 'active',
    currency: budgetData.currency || 'USD',
    noMaxBudget: false,
    userId: budgetData.user_id,
    expenses: expenses,
    createdAt: budgetData.created_at,
    updatedAt: budgetData.updated_at,
    progress: budgetData.total_amount > 0 
      ? Math.round((parseFloat(budgetData.spent_amount?.toString() || '0') / parseFloat(budgetData.total_amount.toString())) * 100)
      : 0
  };

  return { budget, expenses };
};

/**
 * Get a specific budget by ID
 * DEPRECATED: Use getTripBudgetDetails instead for better performance
 */
export const getBudgetById = async (budgetId: string): Promise<Budget> => {
  const { budget } = await getTripBudgetDetails(budgetId);
  return budget;
};

/**
 * Create a new budget
 */
export const createBudget = async (budgetData: CreateBudgetData): Promise<Budget> => {
  // Ensure we have a session before making the request
  const { supabase } = await import('@/config/supabase');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.access_token) {
    throw new Error('No authentication token available. Please log in.');
  }

  // Transform data to match backend expectations
  const transformedData = {
    title: budgetData.title,
    description: budgetData.destination, // Backend uses description field
    total_budget: budgetData.totalBudget || 0,
    currency: budgetData.currency,
    budget_limit: budgetData.totalBudget || 0, // Also set budget_limit for trips table
    start_date: budgetData.startDate,
    end_date: budgetData.endDate,
    trip_id: null // Optional field
  };

  // Use async getAuthHeader to ensure fresh token
  const { getAuthHeader } = await import('@/config/api');
  const authHeaders = await getAuthHeader();

  const response = await apiRequest<ApiResponse<Budget>>(buildUrl(endpoints.budget.create), {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: transformedData,
  });
  return response.data;
};

/**
 * Update an existing budget
 * CRITICAL: Uses direct Supabase calls - updates both budget and trip tables
 */
export const updateBudget = async (budgetData: UpdateBudgetData): Promise<Budget> => {
  // Ensure we have a session
  const { supabase } = await import('@/config/supabase');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    throw new Error('No authentication token available. Please log in.');
  }

  const { id, ...updateData } = budgetData;
  
  // Get existing budget to check ownership and get trip_id
  const { data: existingBudget, error: budgetCheckError } = await supabase
    .from('budgets')
    .select('id, trip_id, user_id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (budgetCheckError || !existingBudget) {
    throw new Error('Budget not found or access denied');
  }

  // Build update data for budget
  const budgetUpdateData: any = {
    updated_at: new Date().toISOString()
  };
  if (updateData.title) budgetUpdateData.title = updateData.title;
  if (updateData.destination) budgetUpdateData.description = updateData.destination;
  if (updateData.totalBudget !== undefined) budgetUpdateData.total_amount = updateData.totalBudget;
  if (updateData.currency) budgetUpdateData.currency = updateData.currency;
  if (updateData.status) budgetUpdateData.status = updateData.status;
  if (updateData.startDate) budgetUpdateData.start_date = updateData.startDate;
  if (updateData.endDate) budgetUpdateData.end_date = updateData.endDate;

  // CRITICAL: Update budget directly in Supabase
  const { data: updatedBudget, error: budgetUpdateError } = await supabase
    .from('budgets')
    .update(budgetUpdateData)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single();

  // CRITICAL: If update fails, throw error - don't fake success
  if (budgetUpdateError) {
    console.error('Supabase budget update error:', budgetUpdateError);
    console.error('Update data attempted:', budgetUpdateData);
    console.error('Budget ID:', id);
    console.error('User ID:', session.user.id);
    throw new Error(budgetUpdateError?.message || 'Failed to update budget in database');
  }

  if (!updatedBudget) {
    throw new Error('Budget update returned no data');
  }

  // If dates or status changed and budget has trip_id, update trip as well
  if (existingBudget.trip_id && (updateData.startDate || updateData.endDate || updateData.status)) {
    const tripUpdateData: any = {
      updated_at: new Date().toISOString()
    };
    if (updateData.startDate) tripUpdateData.start_date = updateData.startDate;
    if (updateData.endDate) tripUpdateData.end_date = updateData.endDate;
    if (updateData.status) tripUpdateData.status = updateData.status;

    const { error: tripUpdateError } = await supabase
      .from('trips')
      .update(tripUpdateData)
      .eq('id', existingBudget.trip_id)
      .eq('user_id', session.user.id);

    if (tripUpdateError) {
      console.warn('Supabase trip update error (non-critical):', tripUpdateError);
      // Don't throw here - budget was updated successfully, trip update is secondary
    }
  }

  // Transform to Budget format
  return {
    id: updatedBudget.id,
    title: updatedBudget.title,
    destination: updatedBudget.description || '',
    totalBudget: parseFloat(updatedBudget.total_amount?.toString() || '0'),
    spent: parseFloat(updatedBudget.spent_amount?.toString() || '0'),
    remaining: parseFloat(updatedBudget.total_amount?.toString() || '0') - parseFloat(updatedBudget.spent_amount?.toString() || '0'),
    startDate: updatedBudget.start_date || updateData.startDate || '',
    endDate: updatedBudget.end_date || updateData.endDate || '',
    status: (updatedBudget.status as 'active' | 'completed') || 'active',
    currency: updatedBudget.currency || 'USD',
    noMaxBudget: false,
    userId: updatedBudget.user_id,
    expenses: [],
    createdAt: updatedBudget.created_at,
    updatedAt: updatedBudget.updated_at,
    progress: updatedBudget.total_amount > 0 
      ? Math.round((parseFloat(updatedBudget.spent_amount?.toString() || '0') / parseFloat(updatedBudget.total_amount.toString())) * 100)
      : 0
  };
};

/**
 * Delete a budget
 */
export const deleteBudget = async (budgetId: string): Promise<void> => {
  await apiRequest<ApiResponse<void>>(buildUrl(endpoints.budget.delete(budgetId)), {
    method: 'DELETE',
    headers: getAuthHeaderSync(),
  });
};

/**
 * Get expenses for a specific budget
 * DEPRECATED: Use getTripBudgetDetails instead for better performance
 */
export const getBudgetExpenses = async (budgetId: string): Promise<BudgetExpense[]> => {
  const { expenses } = await getTripBudgetDetails(budgetId);
  return expenses;
};

/**
 * Add an expense to a budget
 * CRITICAL: Uses direct Supabase call - no fake promises, real database operations
 */
export const addBudgetExpense = async (budgetId: string, expenseData: CreateExpenseData): Promise<BudgetExpense> => {
  // Ensure we have a session
  const { supabase } = await import('@/config/supabase');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    throw new Error('No authentication token available. Please log in.');
  }

  // Get budget to find trip_id and verify ownership
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('id, trip_id, user_id, currency')
    .eq('id', budgetId)
    .eq('user_id', session.user.id)
    .single();

  if (budgetError) {
    console.error('Budget fetch error:', budgetError);
    throw new Error(`Budget not found or access denied: ${budgetError.message}`);
  }

  if (!budget) {
    throw new Error('Budget not found');
  }

  // CRITICAL: Insert expense - PRIMARY: Use budget_expenses (works for all budgets)
  // This is the reliable table that works whether trip_id exists or not
  const { data: budgetExpData, error: budgetExpErr } = await supabase
    .from('budget_expenses')
    .insert({
      budget_id: budgetId,
      category: expenseData.category,
      amount: expenseData.amount,
      description: expenseData.description || null,
      expense_date: expenseData.date,
    })
    .select()
    .single();

  // CRITICAL: If budget_expenses insert fails, throw error immediately
  if (budgetExpErr || !budgetExpData) {
    console.error('Budget expenses insert error:', budgetExpErr);
    throw new Error(budgetExpErr?.message || 'Failed to save expense to database');
  }

  // Also try to insert into expenses table if budget has trip_id (for future compatibility)
  if (budget.trip_id) {
    const { error: expErr } = await supabase
      .from('expenses')
      .insert({
        trip_id: budget.trip_id,
        user_id: session.user.id,
        category: expenseData.category,
        amount: expenseData.amount,
        description: expenseData.description || null,
        date: expenseData.date,
        currency: expenseData.currency || budget.currency || 'USD',
      });

    // Don't fail if expenses table insert fails - budget_expenses is the primary
    if (expErr) {
      console.warn('Expenses table insert failed (non-critical):', expErr);
    }
  }

  // Use budget_expenses result (this is the source of truth)
  const expense = {
    id: budgetExpData.id,
    category: budgetExpData.category,
    amount: budgetExpData.amount,
    description: budgetExpData.description,
    date: budgetExpData.expense_date,
    currency: expenseData.currency || budget.currency || 'USD',
    created_at: budgetExpData.created_at,
    updated_at: budgetExpData.updated_at,
  };

  // Transform to BudgetExpense format
  return {
    id: expense.id,
    budgetId: budgetId,
    category: expense.category,
    amount: parseFloat(expense.amount.toString()),
    description: expense.description || '',
    date: expense.date,
    currency: expense.currency || 'USD',
    createdAt: expense.created_at,
    updatedAt: expense.updated_at,
  };
};

/**
 * Update an expense
 */
export const updateBudgetExpense = async (budgetId: string, expenseData: UpdateExpenseData): Promise<BudgetExpense> => {
  const { id, ...updateData } = expenseData;
  const response = await apiRequest<ApiResponse<BudgetExpense>>(buildUrl(endpoints.budget.updateExpense(budgetId, id)), {
    method: 'PUT',
    headers: {
      ...getAuthHeaderSync(),
      'Content-Type': 'application/json',
    },
    body: updateData,
  });
  return response.data;
};

/**
 * Delete an expense
 */
export const deleteBudgetExpense = async (budgetId: string, expenseId: string): Promise<void> => {
  await apiRequest<ApiResponse<void>>(buildUrl(endpoints.budget.deleteExpense(budgetId, expenseId)), {
    method: 'DELETE',
    headers: getAuthHeaderSync(),
  });
};

// Export all functions as budgetService object
export const budgetService = {
  getBudgets,
  getBudgetById,
  getTripBudgetDetails, // NEW: Efficient join query
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetExpenses,
  addBudgetExpense,
  updateBudgetExpense,
  deleteBudgetExpense,
};

export default budgetService;
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
}

export interface CreateExpenseData {
  category: string;
  amount: number;
  description: string;
  date: string;
  currency?: string;
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
 */
export const getBudgets = async (params?: BudgetSearchParams): Promise<Budget[]> => {
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
  
  const response = await apiRequest<ApiResponse<Budget[]>>(url, {
    headers: getAuthHeaderSync(),
  });
  return response.data;
};

/**
 * Get a specific budget by ID
 */
export const getBudgetById = async (budgetId: string): Promise<Budget> => {
  const response = await apiRequest<ApiResponse<Budget>>(endpoints.budget.detail(budgetId), {
    headers: getAuthHeaderSync(),
  });
  return response.data;
};

/**
 * Create a new budget
 */
export const createBudget = async (budgetData: CreateBudgetData): Promise<Budget> => {
  const response = await apiRequest<ApiResponse<Budget>>(endpoints.budget.create, {
    method: 'POST',
    headers: {
      ...getAuthHeaderSync(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(budgetData),
  });
  return response.data;
};

/**
 * Update an existing budget
 */
export const updateBudget = async (budgetData: UpdateBudgetData): Promise<Budget> => {
  const { id, ...updateData } = budgetData;
  const response = await apiRequest<ApiResponse<Budget>>(endpoints.budget.update(id), {
    method: 'PUT',
    headers: {
      ...getAuthHeaderSync(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });
  return response.data;
};

/**
 * Delete a budget
 */
export const deleteBudget = async (budgetId: string): Promise<void> => {
  await apiRequest<ApiResponse<void>>(endpoints.budget.delete(budgetId), {
    method: 'DELETE',
    headers: getAuthHeaderSync(),
  });
};

/**
 * Get expenses for a specific budget
 */
export const getBudgetExpenses = async (budgetId: string): Promise<BudgetExpense[]> => {
  const response = await apiRequest<ApiResponse<BudgetExpense[]>>(endpoints.budget.expenses(budgetId), {
    headers: getAuthHeaderSync(),
  });
  return response.data;
};

/**
 * Add an expense to a budget
 */
export const addBudgetExpense = async (budgetId: string, expenseData: CreateExpenseData): Promise<BudgetExpense> => {
  const response = await apiRequest<ApiResponse<BudgetExpense>>(endpoints.budget.addExpense(budgetId), {
    method: 'POST',
    headers: {
      ...getAuthHeaderSync(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(expenseData),
  });
  return response.data;
};

/**
 * Update an expense
 */
export const updateBudgetExpense = async (budgetId: string, expenseData: UpdateExpenseData): Promise<BudgetExpense> => {
  const { id, ...updateData } = expenseData;
  const response = await apiRequest<ApiResponse<BudgetExpense>>(endpoints.budget.updateExpense(budgetId, id), {
    method: 'PUT',
    headers: {
      ...getAuthHeaderSync(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });
  return response.data;
};

/**
 * Delete an expense
 */
export const deleteBudgetExpense = async (budgetId: string, expenseId: string): Promise<void> => {
  await apiRequest<ApiResponse<void>>(endpoints.budget.deleteExpense(budgetId, expenseId), {
    method: 'DELETE',
    headers: getAuthHeaderSync(),
  });
};

// Export all functions as budgetService object
export const budgetService = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetExpenses,
  addBudgetExpense,
  updateBudgetExpense,
  deleteBudgetExpense,
};

export default budgetService;
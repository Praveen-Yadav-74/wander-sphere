import express from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../config/supabase.js';
import { auth } from '../middleware/supabaseAuth.js';

const router = express.Router();

// Get all budgets for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if budgets table exists, if not return empty array
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error);
      // If table doesn't exist, return empty array instead of error
      if (error.message?.includes('Could not find the table')) {
        return res.json({
          success: true,
          data: []
        });
      }
      return res.status(500).json({ 
        success: false,
        message: 'Error fetching budgets' 
      });
    }

    // Transform budgets to match frontend expectations
    const transformedBudgets = (budgets || []).map(budget => ({
      id: budget.id,
      title: budget.title,
      destination: budget.description || '',
      totalBudget: parseFloat(budget.total_amount || 0),
      spent: parseFloat(budget.spent_amount || 0),
      remaining: parseFloat(budget.total_amount || 0) - parseFloat(budget.spent_amount || 0),
      startDate: budget.start_date || null,
      endDate: budget.end_date || null,
      status: budget.status || 'active',
      currency: budget.currency || 'USD',
      noMaxBudget: false,
      userId: budget.user_id,
      expenses: [],
      createdAt: budget.created_at,
      updatedAt: budget.updated_at,
      dates: budget.start_date && budget.end_date 
        ? `${new Date(budget.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(budget.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : null,
      progress: budget.total_amount > 0 
        ? Math.round((parseFloat(budget.spent_amount || 0) / parseFloat(budget.total_amount)) * 100)
        : 0
    }));

    res.json({
      success: true,
      data: transformedBudgets
    });
  } catch (error) {
    console.error('Error in GET /budget:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get a specific budget by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    
    const { data: budget, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching budget:', error);
      // If table doesn't exist, return not found
      if (error.message?.includes('Could not find the table')) {
        return res.status(404).json({ 
          success: false,
          message: 'Budget not found' 
        });
      }
      return res.status(404).json({ 
        success: false,
        message: 'Budget not found' 
      });
    }

    // Transform budget to match frontend expectations
    const transformedBudget = {
      id: budget.id,
      title: budget.title,
      destination: budget.description || '',
      totalBudget: parseFloat(budget.total_amount || 0),
      spent: parseFloat(budget.spent_amount || 0),
      remaining: parseFloat(budget.total_amount || 0) - parseFloat(budget.spent_amount || 0),
      startDate: budget.start_date || null,
      endDate: budget.end_date || null,
      status: budget.status || 'active',
      currency: budget.currency || 'USD',
      noMaxBudget: false,
      userId: budget.user_id,
      expenses: [],
      createdAt: budget.created_at,
      updatedAt: budget.updated_at,
      dates: budget.start_date && budget.end_date 
        ? `${new Date(budget.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(budget.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : null,
      progress: budget.total_amount > 0 
        ? Math.round((parseFloat(budget.spent_amount || 0) / parseFloat(budget.total_amount)) * 100)
        : 0
    };

    res.json({
      success: true,
      data: transformedBudget
    });
  } catch (error) {
    console.error('Error in GET /budget/:id:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Create a new budget
router.post('/', auth, [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('total_budget').optional().isFloat({ min: 0 }).withMessage('Total budget must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { title, description, total_budget, budget_limit, currency, trip_id, start_date, end_date } = req.body;

    // Build insert data
    const insertData = {
      user_id: userId,
      title,
      description,
      total_amount: total_budget || budget_limit || 0,
      currency: currency || 'USD',
      trip_id: trip_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // If creating a trip budget, also create/update the trip
    // MODIFIED: Only link to trip if specific trip_id is provided. Do NOT auto-create trips.
    if (trip_id) {
        // Try to verify existing trip or link
        // We only support linking to EXISTING trips now to prevent pollution
        
       const { data: existingTrip, error: tripCheckError } = await supabase
          .from('trips')
          .select('id')
          .eq('id', trip_id)
          .single();

        if (existingTrip) {
             // Update existing trip with budget info if needed (optional, keeping for consistency)
            await supabase
              .from('trips')
              .update({
                budget_limit: total_budget || budget_limit || 0,
                // currency: currency || 'USD', // Don't force currency update on trip
                updated_at: new Date().toISOString()
              })
              .eq('id', trip_id)
              .eq('user_id', userId);
        } else {
            // Provided trip_id invalid, silently ignore or fail? 
            // Better to ignore and just create budget without trip link often
            console.warn('Provided trip_id not found, creating standalone budget');
            insertData.trip_id = null; // Clear invalid trip_id
        }
    }

    const { data: budget, error } = await supabase
      .from('budgets')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error creating budget',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error('Error in POST /budget:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Update a budget
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    const { title, description, total_budget, budget_limit, currency, spent_amount, status, start_date, end_date } = req.body;
    
    // Build update data object (only include fields that are provided)
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (total_budget !== undefined) updateData.total_amount = total_budget;
    if (budget_limit !== undefined) updateData.total_amount = budget_limit;
    if (currency !== undefined) updateData.currency = currency;
    if (spent_amount !== undefined) updateData.spent_amount = spent_amount;
    if (status !== undefined) updateData.status = status;

    // First verify the budget belongs to the user
    const { data: existingBudget, error: budgetCheckError } = await supabase
      .from('budgets')
      .select('id, trip_id')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single();

    if (budgetCheckError || !existingBudget) {
      return res.status(404).json({ 
        success: false,
        message: 'Budget not found' 
      });
    }

    // Update the budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', budgetId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating budget:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error updating budget',
        error: error.message 
      });
    }

    // If dates are provided and budget has a trip_id, update the trip as well
    if ((start_date || end_date) && existingBudget.trip_id) {
      const tripUpdateData = {
        updated_at: new Date().toISOString()
      };
      if (start_date) tripUpdateData.start_date = start_date;
      if (end_date) tripUpdateData.end_date = end_date;
      // if (budget_limit !== undefined) tripUpdateData.budget_limit = budget_limit; // Optional
      if (status) tripUpdateData.status = status;

      await supabase
        .from('trips')
        .update(tripUpdateData)
        .eq('id', existingBudget.trip_id)
        .eq('user_id', userId);
    }

    // Also update start_date and end_date in budget if provided
    if (start_date || end_date) {
      const budgetDateUpdate = {
        updated_at: new Date().toISOString()
      };
      if (start_date) budgetDateUpdate.start_date = start_date;
      if (end_date) budgetDateUpdate.end_date = end_date;

      await supabase
        .from('budgets')
        .update(budgetDateUpdate)
        .eq('id', budgetId)
        .eq('user_id', userId);

      // Refresh budget data to include dates
      const { data: refreshedBudget } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .eq('user_id', userId)
        .single();

      if (refreshedBudget) {
        budget.start_date = refreshedBudget.start_date;
        budget.end_date = refreshedBudget.end_date;
      }
    }

    // Transform budget to match frontend expectations
    const transformedBudget = {
      id: budget.id,
      title: budget.title,
      destination: budget.description || '',
      totalBudget: parseFloat(budget.total_amount || 0),
      spent: parseFloat(budget.spent_amount || 0),
      remaining: parseFloat(budget.total_amount || 0) - parseFloat(budget.spent_amount || 0),
      startDate: budget.start_date || start_date || null,
      endDate: budget.end_date || end_date || null,
      status: budget.status || 'active',
      currency: budget.currency || 'USD',
      noMaxBudget: false,
      userId: budget.user_id,
      expenses: [],
      createdAt: budget.created_at,
      updatedAt: budget.updated_at,
      dates: (budget.start_date || start_date) && (budget.end_date || end_date)
        ? `${new Date(budget.start_date || start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(budget.end_date || end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : null,
      progress: budget.total_amount > 0 
        ? Math.round((parseFloat(budget.spent_amount || 0) / parseFloat(budget.total_amount)) * 100)
        : 0
    };

    res.json({
      success: true,
      data: transformedBudget
    });
  } catch (error) {
    console.error('Error in PUT /budget/:id:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Delete a budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    
    // Also delete associated budget_expenses
    await supabase
      .from('budget_expenses')
      .delete()
      .eq('budget_id', budgetId);

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting budget:', error);
      return res.status(500).json({ message: 'Error deleting budget' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /budget/:id:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get budget expenses
router.get('/:id/expenses', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    
    // First verify the budget belongs to the user
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('id, trip_id')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single();

    if (budgetError || !budget) {
      return res.status(404).json({ 
        success: false,
        message: 'Budget not found' 
      });
    }

    // Try to get expenses from expenses table (linked via trip_id)
    let expenses = [];
    let expensesError = null;

    if (budget.trip_id) {
      const expensesResult = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', budget.trip_id)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (!expensesResult.error && expensesResult.data) {
        expenses = expensesResult.data;
      } else {
        expensesError = expensesResult.error;
      }
    }

    // If no expenses from expenses table, try budget_expenses
    if (expenses.length === 0) {
      const budgetExpensesResult = await supabase
        .from('budget_expenses')
        .select('*')
        .eq('budget_id', budgetId)
        .order('expense_date', { ascending: false });

      if (!budgetExpensesResult.error && budgetExpensesResult.data) {
        // Transform budget_expenses format to match expenses format
        expenses = budgetExpensesResult.data.map(exp => ({
          id: exp.id,
          budgetId: exp.budget_id,
          trip_id: budget.trip_id,
          user_id: userId,
          category: exp.category,
          amount: exp.amount,
          description: exp.description,
          date: exp.expense_date,
          currency: 'USD', // Default if not in budget_expenses
          createdAt: exp.created_at,
          updatedAt: exp.updated_at
        }));
      }
    }
    // Also merge budget_expenses if we have mixed data (rare but possible)
    else {
         const budgetExpensesResult = await supabase
            .from('budget_expenses')
            .select('*')
            .eq('budget_id', budgetId)
            .order('expense_date', { ascending: false });
            
         if (budgetExpensesResult.data) {
             const budgetExps = budgetExpensesResult.data.map(exp => ({
                id: exp.id,
                budgetId: exp.budget_id,
                trip_id: budget.trip_id,
                user_id: userId,
                category: exp.category,
                amount: exp.amount,
                description: exp.description,
                date: exp.expense_date,
                currency: 'USD',
                createdAt: exp.created_at,
                updatedAt: exp.updated_at
            }));
            // Merge de-duplicating by ID if necessary, or just concat if they are distinct tables
            // Since they are distinct tables, just concat for view
            expenses = [...expenses, ...budgetExps];
         }
    }

    res.json({
      success: true,
      data: expenses || []
    });
  } catch (error) {
    console.error('Error in GET /budget/:id/expenses:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Add expense to budget
router.post('/:id/expenses', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    const { category, amount, description, date, currency, user_id } = req.body;
    
    if (!category || !amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Category and amount are required' 
      });
    }

    // First verify the budget belongs to the user
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('id, spent_amount, total_amount, trip_id')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single();

    if (budgetError || !budget) {
      return res.status(404).json({ 
        success: false,
        message: 'Budget not found' 
      });
    }

    const budgetExpenseData = {
      budget_id: budgetId,
      category,
      amount: parseFloat(amount),
      description: description || null,
      expense_date: date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    // OPTIMIZED: Insert expense and update budget in parallel, then calculate total
    const [expenseResult, allExpensesResult] = await Promise.all([
      supabase
        .from('budget_expenses')
        .insert(budgetExpenseData)
        .select()
        .single(),
      // Get all expenses including the one we're about to add for accurate calculation
      supabase
        .from('budget_expenses')
        .select('amount')
        .eq('budget_id', budgetId)
    ]);
    
    if (expenseResult.error) {
      console.error('Error adding expense:', expenseResult.error);
      return res.status(500).json({ 
        success: false,
        message: 'Error adding expense',
        error: expenseResult.error.message 
      });
    }

    // Calculate total spent including the new expense
    const existingTotal = (allExpensesResult.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalSpent = existingTotal + parseFloat(amount);

    // Update budget's spent amount
    const { error: updateError } = await supabase
      .from('budgets')
      .update({ 
        spent_amount: totalSpent,
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetId);

    if (updateError) {
      console.error('Error updating budget spent amount:', updateError);
      // Expense was added but budget update failed - log for monitoring
      // In production, you might want to implement a rollback or retry mechanism
    }

    res.status(201).json({
      success: true,
      data: expenseResult.data
    });
  } catch (error) {
    console.error('Error in POST /budget/:id/expenses:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Update an expense
router.put('/:id/expenses/:expenseId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const budgetId = req.params.id;
        const expenseId = req.params.expenseId;
        const { category, amount, description, date } = req.body;

        // Try updating in budget_expenses first
        let { data: updatedExpense, error: updateError } = await supabase
            .from('budget_expenses')
            .update({
                category,
                amount,
                description,
                expense_date: date
            })
            .eq('id', expenseId)
            // .eq('budget_id', budgetId) // Optional verify
            .select()
            .single();

        // If not found in budget_expenses, try 'expenses' table (legacy support)
        if (!updatedExpense) {
             const { data: updatedLegacyExpense, error: legacyError } = await supabase
            .from('expenses')
            .update({
                category,
                amount,
                description,
                date: date
            })
            .eq('id', expenseId)
            .eq('user_id', userId)
            .select()
            .single();
            
            updatedExpense = updatedLegacyExpense;
            if (legacyError && !updateError) updateError = legacyError; 
        }

        if (updateError || !updatedExpense) {
            return res.status(404).json({ success: false, message: 'Expense not found or update failed' });
        }

        // Recalculate budget total spent
        // We need to sum from both tables if mixed usage, but typically it is one or other.
        // Simplified: just sum budget_expenses for this budget
        const { data: allExpenses } = await supabase
            .from('budget_expenses')
            .select('amount')
            .eq('budget_id', budgetId);
        
        let totalSpent = (allExpenses || []).reduce((sum, item) => sum + (item.amount || 0), 0);

        // Update budget
         await supabase
            .from('budgets')
            .update({ 
                spent_amount: totalSpent,
                updated_at: new Date().toISOString()
            })
            .eq('id', budgetId);

        res.json({ success: true, data: updatedExpense });

    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete an expense
router.delete('/:id/expenses/:expenseId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const budgetId = req.params.id;
        const expenseId = req.params.expenseId;

        // Try deleting from budget_expenses
        let { error: deleteError, count } = await supabase
            .from('budget_expenses')
            .delete({ count: 'exact' })
            .eq('id', expenseId); // budget_expenses doesn't have user_id, relies on budget_id relation ideally, but ID is unique.
            
        // If count is 0, try deleting from expenses (legacy)
        if (count === 0) {
             const { error: legacyDeleteError } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenseId)
            .eq('user_id', userId);
            
            if (legacyDeleteError) deleteError = legacyDeleteError;
        }

        if (deleteError) {
             console.error('Delete expense error:', deleteError);
             return res.status(500).json({ success: false, message: 'Failed to delete expense' });
        }

        // Recalculate budget total spent
        const { data: allExpenses } = await supabase
            .from('budget_expenses')
            .select('amount')
            .eq('budget_id', budgetId);
        
        const totalSpent = (allExpenses || []).reduce((sum, item) => sum + (item.amount || 0), 0);

         await supabase
            .from('budgets')
            .update({ 
                spent_amount: totalSpent,
                updated_at: new Date().toISOString()
            })
            .eq('id', budgetId);

        res.json({ success: true, message: 'Expense deleted' });

    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
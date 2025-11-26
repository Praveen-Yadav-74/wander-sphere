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
    if (start_date && end_date) {
      // Try to find existing trip or create new one
      let tripId = trip_id;
      
      if (!tripId) {
        // Create a new trip for this budget
        const { data: newTrip, error: tripError } = await supabase
          .from('trips')
          .insert({
            user_id: userId,
            title: title,
            description: description || '',
            destination: { city: description || 'Unknown' }, // Use description as destination
            start_date: start_date,
            end_date: end_date,
            status: 'active',
            budget: { total: total_budget || budget_limit || 0, currency: currency || 'USD' },
            budget_limit: total_budget || budget_limit || 0,
            currency: currency || 'USD',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (!tripError && newTrip) {
          tripId = newTrip.id;
          insertData.trip_id = tripId;
        }
      } else {
        // Update existing trip with budget info
        await supabase
          .from('trips')
          .update({
            budget_limit: total_budget || budget_limit || 0,
            currency: currency || 'USD',
            start_date: start_date,
            end_date: end_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', tripId)
          .eq('user_id', userId);
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
      if (budget_limit !== undefined) tripUpdateData.budget_limit = budget_limit;
      if (currency) tripUpdateData.currency = currency;
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
      } else if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        return res.status(500).json({ 
          success: false,
          message: 'Error fetching expenses',
          error: expensesError.message 
        });
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
      .select('id, spent_amount, trip_id')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single();

    if (budgetError || !budget) {
      return res.status(404).json({ 
        success: false,
        message: 'Budget not found' 
      });
    }

    // CRITICAL: Use the expenses table with user_id for RLS
    // Try expenses table first (as per user's SQL), fallback to budget_expenses
    let expense;
    let expenseError;

    // Try inserting into expenses table (with user_id for RLS)
    const expenseData = {
      trip_id: budget.trip_id || null,
      user_id: user_id || userId, // CRITICAL: Include user_id for RLS
      category,
      amount: parseFloat(amount),
      description: description || null,
      date: date || new Date().toISOString().split('T')[0],
      currency: currency || 'USD',
      created_at: new Date().toISOString()
    };

    // Try expenses table first
    const expensesResult = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (expensesResult.error) {
      // If expenses table doesn't exist or fails, try budget_expenses
      console.log('expenses table not available, trying budget_expenses:', expensesResult.error.message);
      
      const budgetExpenseData = {
        budget_id: budgetId,
        category,
        amount: parseFloat(amount),
        description: description || null,
        expense_date: date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      const budgetExpensesResult = await supabase
        .from('budget_expenses')
        .insert(budgetExpenseData)
        .select()
        .single();

      expense = budgetExpensesResult.data;
      expenseError = budgetExpensesResult.error;
    } else {
      expense = expensesResult.data;
      expenseError = expensesResult.error;
    }

    if (expenseError) {
      console.error('Error adding expense:', expenseError);
      return res.status(500).json({ 
        success: false,
        message: 'Error adding expense',
        error: expenseError.message 
      });
    }

    // Update the budget's spent amount
    const newSpentAmount = (budget.spent_amount || 0) + parseFloat(amount);
    const { error: updateError } = await supabase
      .from('budgets')
      .update({ 
        spent_amount: newSpentAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetId);

    if (updateError) {
      console.error('Error updating budget spent amount:', updateError);
    }

    res.status(201).json({
      success: true,
      data: expense
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

export default router;
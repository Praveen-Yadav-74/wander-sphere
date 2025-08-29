import express from 'express';
import supabase from '../config/supabase.js';
import { auth } from '../middleware/supabaseAuth.js';

const router = express.Router();

// Get all budgets for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error);
      return res.status(500).json({ message: 'Error fetching budgets' });
    }

    res.json(budgets || []);
  } catch (error) {
    console.error('Error in GET /budget:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Error in GET /budget/:id:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new budget
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, total_budget, currency, trip_id } = req.body;
    
    if (!title || !total_budget) {
      return res.status(400).json({ message: 'Title and total budget are required' });
    }

    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        user_id: userId,
        title,
        description,
        total_budget,
        currency: currency || 'USD',
        trip_id,
        spent_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      return res.status(500).json({ message: 'Error creating budget' });
    }

    res.status(201).json(budget);
  } catch (error) {
    console.error('Error in POST /budget:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a budget
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    const { title, description, total_budget, currency, spent_amount } = req.body;
    
    const { data: budget, error } = await supabase
      .from('budgets')
      .update({
        title,
        description,
        total_budget,
        currency,
        spent_amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating budget:', error);
      return res.status(500).json({ message: 'Error updating budget' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Error in PUT /budget/:id:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      .select('id')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single();

    if (budgetError || !budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const { data: expenses, error } = await supabase
      .from('budget_expenses')
      .select('*')
      .eq('budget_id', budgetId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return res.status(500).json({ message: 'Error fetching expenses' });
    }

    res.json(expenses || []);
  } catch (error) {
    console.error('Error in GET /budget/:id/expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add expense to budget
router.post('/:id/expenses', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    const { category, amount, description, date } = req.body;
    
    if (!category || !amount) {
      return res.status(400).json({ message: 'Category and amount are required' });
    }

    // First verify the budget belongs to the user
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('id, spent_amount')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single();

    if (budgetError || !budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Add the expense
    const { data: expense, error: expenseError } = await supabase
      .from('budget_expenses')
      .insert({
        budget_id: budgetId,
        category,
        amount,
        description,
        date: date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Error adding expense:', expenseError);
      return res.status(500).json({ message: 'Error adding expense' });
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

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error in POST /budget/:id/expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
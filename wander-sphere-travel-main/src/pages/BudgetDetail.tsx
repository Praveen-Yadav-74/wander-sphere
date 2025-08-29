import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, DollarSign, Calendar, MapPin, TrendingUp, PieChart, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { budgetService, Budget, BudgetExpense, CreateExpenseData } from "@/services/budgetService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const BudgetDetail = () => {
  const { id } = useParams();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<CreateExpenseData>>({
    category: "",
    amount: 0,
    description: "",
    date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!id) {
          setError('Budget ID is required');
          return;
        }

        // Fetch budget details and expenses concurrently
        const [budgetData, expensesData] = await Promise.all([
          budgetService.getBudgetById(id),
          budgetService.getBudgetExpenses(id)
        ]);
        
        setBudget(budgetData);
        setExpenses(expensesData);
      } catch (err) {
        setError('Failed to load budget details');
        console.error('Error fetching budget data:', err);
        toast({
          title: "Error",
          description: "Failed to load budget details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBudgetData();
    }
  }, [id, toast]);
  
  const [currency, setCurrency] = useState(budget?.currency || 'USD');
  
  // Currency conversion rates (simplified for demo)
  const conversionRates = {
    USD: 1,
    EUR: 0.93,
    GBP: 0.79,
    JPY: 151.72,
    CNY: 7.24,
    INR: 83.42,
    CAD: 1.37,
    AUD: 1.52,
    RUB: 91.75,
    BRL: 5.16
  };
  
  // Function to convert amount from one currency to another
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    const inUSD = amount / conversionRates[fromCurrency as keyof typeof conversionRates];
    return inUSD * conversionRates[toCurrency as keyof typeof conversionRates];
  };
  
  // Get converted budget values
  const convertedTotalBudget = budget?.noMaxBudget ? null : budget ? convertCurrency(budget.totalBudget, budget.currency, currency) : 0;
  const convertedSpent = budget ? convertCurrency(budget.spent, budget.currency, currency) : 0;
  const convertedRemaining = budget?.noMaxBudget ? null : budget ? convertCurrency(budget.remaining, budget.currency, currency) : 0;
  
  // Get currency symbol
  const getCurrencySymbol = (currencyCode: string) => {
    switch (currencyCode) {
      case "USD":
      case "CAD":
      case "AUD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "JPY":
      case "CNY":
        return "¥";
      case "INR":
        return "₹";
      case "RUB":
        return "₽";
      case "BRL":
        return "R$";
      default:
        return "$";
    }
  };

  // Calculate category spending from expenses
  const categoryColors = {
    "Accommodation": "bg-primary",
    "Food": "bg-success",
    "Transport": "bg-warning",
    "Activities": "bg-accent",
    "Shopping": "bg-destructive",
    "Miscellaneous": "bg-muted",
  };

  const categories = Object.keys(categoryColors).map(categoryName => {
    const categoryExpenses = expenses.filter(expense => expense.category === categoryName);
    const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return {
      name: categoryName,
      spent,
      budget: budget?.totalBudget ? Math.floor(budget.totalBudget / 6) : 0, // Distribute budget evenly
      color: categoryColors[categoryName as keyof typeof categoryColors],
    };
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAddExpense = async () => {
    if (!id || !newExpense.category || !newExpense.amount || !newExpense.description || !newExpense.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingExpenses(true);
      
      const expenseData: CreateExpenseData = {
        category: newExpense.category!,
        amount: Number(newExpense.amount),
        description: newExpense.description!,
        date: newExpense.date!,
      };
      
      const createdExpense = await budgetService.addBudgetExpense(id, expenseData);
      setExpenses(prev => [createdExpense, ...prev]);
      
      // Update budget spent amount
      if (budget) {
        setBudget(prev => prev ? {
          ...prev,
          spent: prev.spent + Number(newExpense.amount),
          remaining: prev.noMaxBudget ? prev.remaining : prev.remaining - Number(newExpense.amount)
        } : null);
      }
      
      setNewExpense({ category: "", amount: 0, description: "", date: "" });
      setIsAddExpenseOpen(false);
      
      toast({
        title: "Success",
        description: "Expense added successfully!",
      });
    } catch (err) {
      console.error('Error adding expense:', err);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || "bg-muted";
  };

  const getCategoryProgress = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return 0;
    return (category.spent / category.budget) * 100;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading budget details...</h2>
          <p className="text-gray-600">Please wait while we fetch your budget information.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error loading budget</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Link to="/budget">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budgets
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Budget not found</h2>
          <p className="text-gray-600 mb-4">The budget you're looking for doesn't exist.</p>
          <Link to="/budget">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Budgets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/budget">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Budget Planner
        </Link>
      </Button>

      {/* Budget Header */}
      <Card className="bg-surface-elevated mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
        <h1 className="text-3xl font-bold mb-2">{budget.title}</h1>
        <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {budget.destination}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
          </div>
          <Badge variant={budget.status === "active" ? "default" : "secondary"}>
            {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
          </Badge>
          {budget.noMaxBudget && (
            <Badge variant="outline" className="bg-warning/10 text-warning">
              No Max Budget
            </Badge>
          )}
        </div>
      </div>
            <div className="flex gap-4">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CNY">CNY (¥)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="RUB">RUB (₽)</SelectItem>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  className="bg-gradient-primary text-white" 
                  onClick={() => setIsAddExpenseOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </div>
              
              <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={newExpense.category} onValueChange={(value) => setNewExpense({...newExpense, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.name} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ({budget.currency})</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={newExpense.amount || ''}
                        onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What did you spend money on?"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    />
                  </div>
                  <Button 
                    onClick={handleAddExpense} 
                    disabled={isLoadingExpenses || !newExpense.category || !newExpense.amount || !newExpense.description || !newExpense.date}
                    className="w-full bg-gradient-primary text-white"
                  >
                    {isLoadingExpenses ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {isLoadingExpenses ? 'Adding...' : 'Add Expense'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-surface-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                {budget.noMaxBudget ? (
                  <p className="text-2xl font-bold">No Maximum</p>
                ) : (
                  <p className="text-2xl font-bold">
                    {getCurrencySymbol(currency)}
                    {convertedTotalBudget?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-surface-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-destructive/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-destructive">
                  {getCurrencySymbol(currency)}
                  {convertedSpent.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-surface-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <PieChart className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                {budget.noMaxBudget ? (
                  <p className="text-2xl font-bold text-success">Unlimited</p>
                ) : (
                  <p className="text-2xl font-bold text-success">
                    {getCurrencySymbol(currency)}
                    {convertedRemaining?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-surface-elevated">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Budget Used</p>
            <p className="text-3xl font-bold mb-2">{budget.progress}%</p>
            <Progress value={budget.progress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Breakdown */}
        <Card className="bg-surface-elevated">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ${category.spent} / ${category.budget}
                    </span>
                  </div>
                  <Progress 
                    value={getCategoryProgress(category.name)} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{getCategoryProgress(category.name).toFixed(0)}% used</span>
                    <span>${category.budget - category.spent} remaining</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card className="bg-surface-elevated">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No expenses recorded yet.</p>
                  <p className="text-sm">Add your first expense to start tracking your budget.</p>
                </div>
              ) : (
                expenses.slice(0, 10).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(expense.category)}`}></div>
                      <div>
                        <p className="font-medium text-sm">{expense.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{expense.category}</span>
                          <span>•</span>
                          <span>{formatDate(expense.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{getCurrencySymbol(budget?.currency || 'USD')}{convertCurrency(expense.amount, budget?.currency || 'USD', currency).toFixed(2)}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Expenses Table */}
      <Card className="bg-surface-elevated mt-8">
        <CardHeader>
          <CardTitle>All Expenses ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/20">
                  <th className="text-left p-2 font-medium">Date</th>
                  <th className="text-left p-2 font-medium">Category</th>
                  <th className="text-left p-2 font-medium">Description</th>
                  <th className="text-right p-2 font-medium">Amount</th>
                  <th className="text-center p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <p>No expenses recorded yet.</p>
                      <p className="text-sm">Add your first expense to start tracking your budget.</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-2 text-sm text-muted-foreground">
                        {formatDate(expense.date)}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getCategoryColor(expense.category)}`}></div>
                          <span className="text-sm">{expense.category}</span>
                        </div>
                      </td>
                      <td className="p-2 text-sm">{expense.description}</td>
                      <td className="p-2 text-right font-medium">{getCurrencySymbol(budget?.currency || 'USD')}{convertCurrency(expense.amount, budget?.currency || 'USD', currency).toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetDetail;
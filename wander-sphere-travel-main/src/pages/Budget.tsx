import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, DollarSign, Calendar, MapPin, TrendingUp, PieChart, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { budgetService, Budget as BudgetType, CreateBudgetData } from "@/services/budgetService";
import { userService } from "@/services/supabaseService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Use the Budget interface from budgetService
type BudgetItem = BudgetType;

const Budget = () => {
  const [currency, setCurrency] = useState("USD");
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState<Partial<CreateBudgetData>>({
    title: '',
    destination: '',
    totalBudget: 0,
    startDate: '',
    endDate: '',
    status: 'active',
    currency: 'USD',
    noMaxBudget: false,
  });
  const { toast } = useToast();
  
  // Load currency preference from database on mount
  useEffect(() => {
    const loadCurrencyPreference = async () => {
      try {
        const savedCurrency = await userService.getUserCurrency();
        setCurrency(savedCurrency);
      } catch (error) {
        console.error('Error loading currency preference:', error);
        // Keep default USD if error
      }
    };

    loadCurrencyPreference();
  }, []);

  // Save currency preference to database when changed
  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    try {
      await userService.updateUserPreferences({ currency: newCurrency });
    } catch (error) {
      console.error('Error saving currency preference:', error);
      toast({
        title: "Warning",
        description: "Currency preference could not be saved, but it will work for this session.",
        variant: "default",
      });
    }
  };

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const rawBudgetsData = await budgetService.getBudgets();
        // FIX: This line filters out any null or undefined items from the API response
        const budgetsData = rawBudgetsData.filter(Boolean); 
        setBudgets(budgetsData);
      } catch (err) {
        setError('Failed to load budgets');
        console.error('Error fetching budgets:', err);
        toast({
          title: "Error",
          description: "Failed to load budgets. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgets();
  }, [toast]);
  
  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
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
        return "₹";
    }
  };

  // Handle create budget
  const handleCreateBudget = async () => {
    if (!newBudget.title || !newBudget.destination || !newBudget.startDate || !newBudget.endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('user') !== null;
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to save your budget.",
      });
      // Store budget data in localStorage to restore after login
      localStorage.setItem('pendingBudget', JSON.stringify(newBudget));
      // Store the current page URL to redirect back after login
      localStorage.setItem('redirectAfterAuth', '/budget');
      window.location.href = '/login';
      return;
    }

    try {
      setIsCreating(true);
      const budgetData: CreateBudgetData = {
        title: newBudget.title!,
        destination: newBudget.destination!,
        totalBudget: newBudget.noMaxBudget ? undefined : newBudget.totalBudget || 0,
        startDate: newBudget.startDate!,
        endDate: newBudget.endDate!,
        status: newBudget.status as 'active' | 'upcoming',
        currency: newBudget.currency || 'USD',
        noMaxBudget: newBudget.noMaxBudget,
      };
      
      const createdBudget = await budgetService.createBudget(budgetData);
      setBudgets(prev => [createdBudget, ...prev]);
      setIsDialogOpen(false);
      setNewBudget({
        title: '',
        destination: '',
        totalBudget: 0,
        startDate: '',
        endDate: '',
        status: 'active',
        currency: 'INR',
        noMaxBudget: false,
      });
      
      toast({
        title: "Success",
        description: "Budget created successfully!",
      });
    } catch (err) {
      console.error('Error creating budget:', err);
      toast({
        title: "Error",
        description: "Failed to create budget. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Budget statistics
  const totalBudgets = budgets.length;
  const activeBudgetsCount = budgets.filter(b => b.status === 'active').length;
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalRemaining = budgets.reduce((sum, b) => sum + (b.remaining || 0), 0);


  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "upcoming": return "bg-primary text-primary-foreground";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 50) return "bg-success";
    if (progress < 80) return "bg-warning";
    return "bg-destructive";
  };

  const activeBudgets = budgets.filter(b => b.status === "active");
  const upcomingBudgets = budgets.filter(b => b.status === "upcoming");
  const completedBudgets = budgets.filter(b => b.status === "completed");

  // Calculate summary statistics for each category
  const calculateSummary = (budgetList: BudgetItem[]) => {
    return budgetList.reduce((acc, budget) => {
      return {
        totalBudget: acc.totalBudget + (budget?.totalBudget || 0),
        spent: acc.spent + (budget?.spent || 0),
        remaining: acc.remaining + (budget?.remaining || 0),
        count: acc.count + 1
      };
    }, { totalBudget: 0, spent: 0, remaining: 0, count: 0 });
  };

  const activeSummary = calculateSummary(activeBudgets);
  const upcomingSummary = calculateSummary(upcomingBudgets);
  const completedSummary = calculateSummary(completedBudgets);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-elevated hover:bg-surface-elevated/80 transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Trip Budget Planner</h1>
              <p className="text-muted-foreground mt-1">Keep your travel expenses organized and on track.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="CNY">CNY (¥)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
                <SelectItem value="AUD">AUD (A$)</SelectItem>
                <SelectItem value="RUB">RUB (₽)</SelectItem>
                <SelectItem value="BRL">BRL (R$)</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-white shadow-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Budget</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Trip Title</Label>
                    <Input 
                      id="title" 
                      placeholder="Enter trip title" 
                      value={newBudget.title || ''}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Input 
                      id="destination" 
                      placeholder="Enter destination" 
                      value={newBudget.destination || ''}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, destination: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input 
                        id="startDate" 
                        type="date" 
                        value={newBudget.startDate || ''}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input 
                        id="endDate" 
                        type="date" 
                        value={newBudget.endDate || ''}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="budget">Budget Amount ({currency})</Label>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="noMaxBudget" 
                          className="mr-2" 
                          checked={newBudget.noMaxBudget || false}
                          onChange={(e) => setNewBudget(prev => ({ ...prev, noMaxBudget: e.target.checked }))}
                        />
                        <Label htmlFor="noMaxBudget" className="text-sm">No Max Budget</Label>
                      </div>
                    </div>
                    <Input 
                      id="budget" 
                      type="number" 
                      placeholder="0.00" 
                      value={newBudget.totalBudget || ''}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, totalBudget: Number(e.target.value) }))}
                      disabled={newBudget.noMaxBudget}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={newBudget.status || 'active'} 
                      onValueChange={(value) => setNewBudget(prev => ({ ...prev, status: value as 'active' | 'upcoming' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button 
                      className="bg-gradient-primary text-white" 
                      onClick={handleCreateBudget}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Budget'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {/* Overview Stats for Active */}
          <TabsContent value="active" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading budgets...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budgeted</p>
                      <p className="text-lg font-semibold">{getCurrencySymbol(currency)}{(activeSummary?.totalBudget || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-lg font-semibold">{getCurrencySymbol(currency)}{(activeSummary?.spent || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <PieChart className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-lg font-semibold">{getCurrencySymbol(currency)}{(activeSummary?.remaining || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Trips</p>
                      <p className="text-lg font-semibold">{activeSummary.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <BudgetGrid budgets={activeBudgets} currency={currency} />
              </>
            )}
          </TabsContent>

          {/* Overview Stats for Upcoming */}
          <TabsContent value="upcoming" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading budgets...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budgeted</p>
                      <p className="text-lg font-semibold">{getCurrencySymbol(currency)}{(upcomingSummary?.totalBudget || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-lg font-semibold">{getCurrencySymbol(currency)}{(upcomingSummary?.spent || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <PieChart className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-lg font-semibold">{getCurrencySymbol(currency)}{(upcomingSummary?.remaining || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming Trips</p>
                      <p className="text-lg font-semibold">{upcomingSummary.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <BudgetGrid budgets={upcomingBudgets} currency={currency} />
              </>
            )}
          </TabsContent>

          {/* Overview Stats for Completed */}
          <TabsContent value="completed" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading budgets...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budgeted</p>
                      <p className="text-lg font-semibold">{getCurrencySymbol(currency)}{(completedSummary?.totalBudget || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-lg font-semibold">{getCurrencySymbol(currency)}{(completedSummary?.spent || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <PieChart className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-lg font-semibold">{getCurrencySymbol(currency)}{(completedSummary?.remaining || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Trips</p>
                      <p className="text-lg font-semibold">{completedSummary.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <BudgetGrid budgets={completedBudgets} currency={currency} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Content is now in the tabs above */}
    </div>
  );
};

const BudgetGrid = ({ budgets, currency }: { budgets: BudgetItem[], currency: string }) => {
  const navigate = useNavigate();
  
  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      case "CNY": return "¥";
      case "INR": return "₹";
      case "CAD": return "C$";
      case "AUD": return "A$";
      case "RUB": return "₽";
      case "BRL": return "R$";
      default: return "₹";
    }
  };

  const symbol = getCurrencySymbol(currency);

  if (budgets.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No budgets found</h3>
        <p className="text-muted-foreground">Create your first trip budget to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {budgets.map((budget) => (
        <Card key={budget.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <Link to={`/budget/${budget.id}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-1">{budget.title}</CardTitle>
                <Badge className={`${budget.status === "active" ? "bg-success text-success-foreground" : 
                                  budget.status === "upcoming" ? "bg-primary text-primary-foreground" : 
                                  "bg-muted text-muted-foreground"}`}>
                  {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {budget.destination}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {budget.startDate && budget.endDate 
                  ? `${new Date(budget.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(budget.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : 'Dates not set'
                }
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget Progress</span>
                    <span>{budget.progress}%</span>
                  </div>
                  <Progress 
                    value={budget.progress} 
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Budget</p>
                    <p className="font-semibold">{symbol}{(budget?.totalBudget || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="font-semibold text-destructive">{symbol}{(budget?.spent || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="font-semibold text-success">{symbol}{(budget?.remaining || 0).toLocaleString()}</p>
                  </div>
                </div>

                <Button
                  size="sm" 
                  className="w-full bg-gradient-primary text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/budget/${budget.id}`);
                  }}
                >
                  View & Add Expenses
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
};

export default Budget;
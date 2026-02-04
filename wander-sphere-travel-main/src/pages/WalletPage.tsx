import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowDown, ArrowUp, Loader2, History, RefreshCw, Download, TrendingDown, TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { walletService, WalletDetails } from "@/services/walletService";
import { useAuth } from "@/contexts/AuthContext";
import { useRazorpay } from "@/hooks/useRazorpay";
import AddMoneyModal from "@/components/wallet/AddMoneyModal";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface WalletPageProps {
  embedded?: boolean;
}

const WalletPage: React.FC<WalletPageProps> = ({ embedded = false }) => {
  const { user } = useAuth();
  const { preloadScript } = useRazorpay();

  useEffect(() => { preloadScript(); }, []);
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

  const fetchWalletDetails = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const details = await walletService.getWalletDetails(user.id);
      setWalletDetails(details);
    } catch (error: any) {
      console.error('Error fetching wallet details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load wallet details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, [user?.id]);

  const handleAddMoneySuccess = () => {
    fetchWalletDetails();
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(withdrawAmount);
    
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (!walletDetails || walletDetails.wallet.balance < numAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance in your wallet",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessingWithdrawal(true);
      await walletService.requestWithdrawal(numAmount);
      
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal request has been submitted.",
      });

      setIsWithdrawOpen(false);
      setWithdrawAmount("");
      fetchWalletDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive"
      });
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  const formatTransactionType = (type: string) => {
    const typeMap: Record<string, string> = {
      deposit: 'Deposit',
      booking_payment: 'Booking Payment',
      refund: 'Refund',
      withdrawal: 'Withdrawal',
      cashback: 'Cashback'
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-pink-950 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          <span>Loading wallet details...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-pink-950 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
           <CardHeader>
             <CardTitle className="text-center">Authentication Required</CardTitle>
           </CardHeader>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to view your wallet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balance = walletDetails?.wallet.balance || 0;
  const transactions = walletDetails?.recentTransactions || [];
  
  // Calculate stats
  const totalReceived = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const totalSpent = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-pink-950 p-4 md:p-6"}>
      <div className={embedded ? "space-y-6" : "max-w-6xl mx-auto space-y-6"}>
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400 mb-2">
                My Wallet
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage your travel funds and transactions
              </p>
            </div>
            <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchWalletDetails} 
                className="bg-white/50 backdrop-blur-sm hover:bg-white/80"
                title="Refresh Wallet"
            >
                <RefreshCw className="w-5 h-5" />
            </Button>
        </div>

        {/* Balance Card */}
        <Card className="relative overflow-hidden border-none shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 opacity-95" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
          
          <CardContent className="relative p-6 md:p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-white/80">Available Balance</p>
                  <h2 className="text-3xl md:text-4xl font-bold">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                  <p className="text-[10px] md:text-xs text-white/60 mt-1">Currency: {walletDetails?.wallet.currency || 'INR'}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-white/20 my-6" />

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <Button 
                onClick={() => setIsAddMoneyOpen(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-white/30 h-10 md:h-12 text-sm md:text-base"
              >
                  <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Add Money
              </Button>

              <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/30 h-10 md:h-12 text-sm md:text-base"
                    disabled={balance === 0}
                  >
                    <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Withdrawal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="withdraw-amount">Amount (₹)</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="1"
                        max={balance.toString()}
                        step="0.01"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Available balance: ₹{balance.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-600">
                        <strong>Note:</strong> Withdrawal requests are processed manually within 2-3 business days.
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                       <Button
                        variant="outline"
                        onClick={() => {
                          setIsWithdrawOpen(false);
                          setWithdrawAmount("");
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleWithdraw}
                        disabled={isProcessingWithdrawal || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > balance}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                      >
                        {isProcessingWithdrawal ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Confirm Withdraw"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Spent</p>
                  <h3 className="text-xl md:text-2xl font-bold">₹{totalSpent.toLocaleString('en-IN')}</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Lifetime</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

           <Card className="border-none shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Received</p>
                  <h3 className="text-xl md:text-2xl font-bold">₹{totalReceived.toLocaleString('en-IN')}</h3>
                   <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Lifetime</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Transactions</p>
                  <h3 className="text-xl md:text-2xl font-bold">{transactions.length}</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">All time</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <History className="w-5 h-5" />
                Recent Transactions
            </CardTitle>
            <CardDescription>Your latest wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
             {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <History className="w-8 h-8 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No transactions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start by adding money to your wallet</p>
                </div>
              ) : (
                <div className="space-y-4">
                {transactions.map((transaction) => {
                    const isCredit = transaction.amount > 0;
                    return (
                    <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCredit 
                            ? 'bg-green-100 dark:bg-green-950' 
                            : 'bg-red-100 dark:bg-red-950'
                        }`}>
                            {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                            ) : (
                            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-sm md:text-base truncate">{formatTransactionType(transaction.type)}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs md:text-sm text-muted-foreground truncate max-w-[100px] md:max-w-none">
                                    {transaction.description || 'No description'}
                                </span>
                                <span className="text-[10px] md:text-xs text-muted-foreground px-1.5 py-0.5 bg-background rounded-full border">
                                    {formatDate(transaction.created_at)}
                                </span>
                            </div>
                        </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                        <p className={`font-semibold text-sm md:text-base ${
                            isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                            {isCredit ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                            })}
                        </p>
                        <Badge 
                            variant={
                                transaction.status === 'completed' 
                                ? 'default' 
                                : transaction.status === 'pending' 
                                ? 'secondary'
                                : 'destructive'
                            }
                            className={`text-[10px] md:text-xs px-1.5 py-0.5 ${
                                transaction.status === 'completed'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                : ''
                            }`}
                        >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                        </div>
                    </div>
                    );
                })}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Add Money Modal Component - Logic preserved */}
        <AddMoneyModal
            open={isAddMoneyOpen}
            onOpenChange={setIsAddMoneyOpen}
            onSuccess={handleAddMoneySuccess}
        />
      </div>
    </div>
  );
};

export default WalletPage;

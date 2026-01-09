import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowDown, ArrowUp, Loader2, History } from "lucide-react";
import { walletService, WalletDetails, WalletTransaction } from "@/services/walletService";
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

const WalletPage: React.FC = () => {
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
        description: "Your withdrawal request has been submitted. Please contact support for payout processing.",
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
      <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading wallet...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to view your wallet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balance = walletDetails?.wallet.balance || 0;
  const transactions = walletDetails?.recentTransactions || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Nomad Wallet</h1>
        <p className="text-muted-foreground">Manage your travel funds</p>
      </div>

      {/* Hero Card - Balance */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-white mb-6">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-2">Available Balance</p>
              <p className="text-5xl font-bold">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-sm opacity-80 mt-2">Currency: {walletDetails?.wallet.currency || 'INR'}</p>
            </div>
            <div className="p-4 bg-white/20 rounded-full">
              <Wallet className="w-12 h-12" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button
          onClick={() => setIsAddMoneyOpen(true)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Money
        </Button>
        <Button
          onClick={() => setIsWithdrawOpen(true)}
          variant="outline"
          className="flex-1"
          size="lg"
          disabled={balance === 0}
        >
          <ArrowDown className="w-5 h-5 mr-2" />
          Withdraw
        </Button>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-2">Start by adding money to your wallet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const isCredit = transaction.amount > 0;
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-full ${
                          isCredit
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowUp className="w-5 h-5" />
                        ) : (
                          <ArrowDown className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{formatTransactionType(transaction.type)}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-lg ${
                          isCredit ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isCredit ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          transaction.status === 'completed'
                            ? 'text-green-600'
                            : transaction.status === 'pending'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Money Modal */}
      <AddMoneyModal
        open={isAddMoneyOpen}
        onOpenChange={setIsAddMoneyOpen}
        onSuccess={handleAddMoneySuccess}
      />

      {/* Withdraw Modal */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Amount (₹)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="1"
                max={balance.toString()}
                step="0.01"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available balance: ₹{balance.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Withdrawal requests are processed manually. Please contact support for payout processing.
              </p>
            </div>
            <div className="flex gap-2">
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
                className="flex-1"
              >
                {isProcessingWithdrawal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Request Withdrawal"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPage;


import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRazorpay } from "@/hooks/useRazorpay";
import { paymentService } from "@/services/paymentService";

interface AddMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const { isLoaded, openRazorpay } = useRazorpay();
  const [amount, setAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleProceedToPay = async () => {
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is ₹100",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please log in to add money",
        variant: "destructive"
      });
      return;
    }

    if (!isLoaded) {
      toast({
        title: "Please Wait",
        description: "Payment gateway is loading...",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Safety timeout to prevent infinite processing state
      const safetyTimeout = setTimeout(() => {
        if (isProcessing) {
          setIsProcessing(false);
          toast({
             title: "Request Timeout",
             description: "The payment server is taking too long. Please try again.",
             variant: "destructive"
          });
        }
      }, 20000); // 20 seconds failsafe

      // Use the payment service to handle the complete flow
      await paymentService.processPayment(
        numAmount,
        'wallet',
        undefined,
        openRazorpay,
        (result) => {
          clearTimeout(safetyTimeout);
          // Success callback
          toast({
            title: "Success",
            description: `₹${result.data?.amountAdded?.toFixed(2) || '0.00'} added to your wallet!`,
          });

          onOpenChange(false);
          setAmount("");
          setIsProcessing(false);
          
          if (onSuccess) {
            onSuccess();
          }
        },
        (error) => {
          clearTimeout(safetyTimeout);
          // Failure callback
          console.error('Payment error:', error);
          toast({
            title: "Payment Failed",
            description: error.message || "Failed to process payment",
            variant: "destructive"
          });
          setIsProcessing(false);
        },
        {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
          email: user.email || '',
        }
      );
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Add Money to Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Amount (₹)</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              step="100"
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">Minimum: ₹100</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Quick Add</p>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className={amount === quickAmount.toString() ? "bg-primary text-primary-foreground" : ""}
                >
                  +₹{quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleProceedToPay}
            disabled={isProcessing || !amount || parseFloat(amount) < 100}
            className="w-full bg-gradient-to-r from-primary to-primary/80"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Proceed to Pay"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMoneyModal;


import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Wallet } from "lucide-react";
import { walletService } from "@/services/walletService";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AddMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
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

    try {
      setIsProcessing(true);

      // Create Razorpay order
      const { orderId, razorpayOrder } = await walletService.addFunds(numAmount);

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        // Initialize Razorpay
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || '', // You'll need to add this to your .env
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'WanderSphere',
          description: 'Add money to wallet',
          order_id: orderId,
          handler: async (response: any) => {
            try {
              // Process the deposit after successful payment
              await walletService.processDeposit(
                numAmount,
                response.razorpay_payment_id,
                response.razorpay_order_id
              );

              toast({
                title: "Success",
                description: `₹${numAmount} added to your wallet successfully!`,
              });

              onOpenChange(false);
              setAmount("");
              if (onSuccess) {
                onSuccess();
              }
            } catch (error: any) {
              toast({
                title: "Error",
                description: error.message || "Failed to process payment",
                variant: "destructive"
              });
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            email: user.email || '',
            name: `${user.firstName} ${user.lastName}`.trim() || 'User',
          },
          theme: {
            color: '#6366f1',
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
            }
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
        razorpay.on('payment.failed', (response: any) => {
          toast({
            title: "Payment Failed",
            description: response.error.description || "Payment could not be processed",
            variant: "destructive"
          });
          setIsProcessing(false);
        });
      };

      script.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load payment gateway",
          variant: "destructive"
        });
        setIsProcessing(false);
      };

      document.body.appendChild(script);
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


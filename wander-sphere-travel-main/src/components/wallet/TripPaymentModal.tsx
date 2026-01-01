import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wallet, CreditCard, CheckCircle2 } from "lucide-react";
import { walletService } from "@/services/walletService";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

interface TripPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripAmount: number;
  tripId: string;
  tripTitle?: string;
  onSuccess?: (paymentDetails: { walletAmountUsed: number; razorpayPaymentId?: string }) => void;
}

const TripPaymentModal: React.FC<TripPaymentModalProps> = ({
  open,
  onOpenChange,
  tripAmount,
  tripId,
  tripTitle,
  onSuccess
}) => {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useWallet, setUseWallet] = useState(true);
  const [paymentSplit, setPaymentSplit] = useState<{
    walletAmountUsed: number;
    razorpayAmount: number;
    needsRazorpay: boolean;
  } | null>(null);

  useEffect(() => {
    if (open && user?.id) {
      loadWalletAndCalculateSplit();
    }
  }, [open, user?.id, tripAmount]);

  const loadWalletAndCalculateSplit = async () => {
    try {
      setIsLoading(true);
      const split = await walletService.processTripPayment(tripAmount);
      setPaymentSplit(split);
      setWalletBalance(split.walletBalance);
      setUseWallet(split.walletBalance > 0);
    } catch (error: any) {
      console.error('Error loading wallet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load wallet details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentSplit) return;

    try {
      setIsProcessing(true);

      let walletAmountUsed = 0;
      let razorpayPaymentId: string | undefined;

      // Step 1: Deduct from wallet if applicable
      if (useWallet && paymentSplit.walletAmountUsed > 0) {
        await walletService.deductForTrip(
          paymentSplit.walletAmountUsed,
          tripId,
          `Payment for trip: ${tripTitle || tripId}`
        );
        walletAmountUsed = paymentSplit.walletAmountUsed;
      }

      // Step 2: Process Razorpay payment for remainder if needed
      if (paymentSplit.needsRazorpay && paymentSplit.razorpayAmount > 0) {
        // Create Razorpay order
        const { orderId, razorpayOrder } = await walletService.addFunds(paymentSplit.razorpayAmount);

        // Load Razorpay script dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.body.appendChild(script);
        });

        // Initialize Razorpay
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'WanderSphere',
          description: `Trip payment: ${tripTitle || tripId}`,
          order_id: orderId,
          handler: async (response: any) => {
            try {
              razorpayPaymentId = response.razorpay_payment_id;
              
              toast({
                title: "Payment Successful",
                description: `₹${tripAmount} paid successfully!`,
              });

              onOpenChange(false);
              if (onSuccess) {
                onSuccess({ walletAmountUsed, razorpayPaymentId });
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
            email: user?.email || '',
            name: `${user?.firstName} ${user?.lastName}`.trim() || 'User',
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
      } else {
        // Payment completed with wallet only
        toast({
          title: "Payment Successful",
          description: `₹${walletAmountUsed} paid from wallet!`,
        });

        onOpenChange(false);
        if (onSuccess) {
          onSuccess({ walletAmountUsed });
        }
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Trip Details */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Trip</p>
            <p className="font-semibold">{tripTitle || `Trip #${tripId}`}</p>
            <p className="text-2xl font-bold mt-2">₹{tripAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>

          {/* Wallet Balance */}
          {walletBalance > 0 && (
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Wallet Balance</p>
                      <p className="text-xl font-bold">₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Use Wallet</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Breakdown */}
          {paymentSplit && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Breakdown</Label>
              <div className="space-y-2 text-sm">
                {useWallet && paymentSplit.walletAmountUsed > 0 && (
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-green-600" />
                      Wallet Payment
                    </span>
                    <span className="font-semibold text-green-600">
                      -₹{paymentSplit.walletAmountUsed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {paymentSplit.needsRazorpay && paymentSplit.razorpayAmount > 0 && (
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Razorpay Payment
                    </span>
                    <span className="font-semibold text-blue-600">
                      ₹{paymentSplit.razorpayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t font-semibold">
                  <span>Total</span>
                  <span>₹{tripAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !paymentSplit}
            className="w-full bg-gradient-to-r from-primary to-primary/80"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Pay ₹{tripAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </>
            )}
          </Button>

          {walletBalance === 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Add money to your wallet for faster checkout next time!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripPaymentModal;


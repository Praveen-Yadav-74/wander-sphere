import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Wallet, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useRazorpay } from '@/hooks/useRazorpay';
import { paymentService } from '@/services/paymentService';
import { walletService } from '@/services/walletService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TripPaymentButtonProps {
  tripId: string;
  tripTitle: string;
  amount: number;
  onPaymentSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

export const TripPaymentButton: React.FC<TripPaymentButtonProps> = ({
  tripId,
  tripTitle,
  amount,
  onPaymentSuccess,
  disabled = false,
  className = '',
}) => {
  const { user } = useAuth();
  const { isLoaded, openRazorpay } = useRazorpay();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch wallet balance when modal opens
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (isModalOpen && user?.id) {
        try {
          setIsLoading(true);
          const details = await walletService.getWalletDetails(user.id);
          setWalletBalance(details.wallet.balance || 0);
        } catch (error) {
          console.error('Error fetching wallet balance:', error);
          setWalletBalance(0);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchWalletBalance();
  }, [isModalOpen, user?.id]);

  const handlePayFromWallet = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to make a payment',
        variant: 'destructive',
      });
      return;
    }

    if (walletBalance < amount) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ₹${amount - walletBalance} more in your wallet`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);

      const result = await paymentService.payFromWallet({
        tripId,
        amount,
      });

      toast({
        title: 'Payment Successful',
        description: `₹${result.amountPaid} deducted from wallet. New balance: ₹${result.newBalance.toFixed(2)}`,
      });

      setIsModalOpen(false);
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process wallet payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayWithRazorpay = async (paymentAmount: number) => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to make a payment',
        variant: 'destructive',
      });
      return;
    }

    if (!isLoaded) {
      toast({
        title: 'Please Wait',
        description: 'Payment gateway is loading...',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);

      await paymentService.processPayment(
        paymentAmount,
        'trip',
        tripId,
        openRazorpay,
        (result) => {
          // Success
          toast({
            title: 'Payment Successful',
            description: `Trip booked successfully! Payment ID: ${result.transactionId}`,
          });
          setIsModalOpen(false);
          setIsProcessing(false);
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
        },
        (error) => {
          // Failure
          toast({
            title: 'Payment Failed',
            description: error.message || 'Payment was not completed',
            variant: 'destructive',
          });
          setIsProcessing(false);
        },
        {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
          email: user.email || '',
        }
      );
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const handlePaymentChoice = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        onClick={handlePaymentChoice}
        disabled={disabled || isProcessing}
        className={`bg-gradient-primary text-white ${className}`}
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay Now - ₹{amount.toLocaleString('en-IN')}
          </>
        )}
      </Button>

      {/* Payment Method Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Pay for "{tripTitle}" - ₹{amount.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Wallet Balance Info */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      <span className="font-medium">Wallet Balance</span>
                    </div>
                    <span className="text-lg font-bold">
                      ₹{walletBalance.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Pay from Wallet */}
                {walletBalance >= amount ? (
                  <div className="space-y-2">
                    <Button
                      onClick={handlePayFromWallet}
                      disabled={isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Pay from Wallet
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      ₹{(walletBalance - amount).toFixed(2)} will remain in wallet
                    </p>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient wallet balance. You need ₹{(amount - walletBalance).toFixed(2)} more.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Pay via Razorpay */}
                <div className="space-y-2">
                  {walletBalance > 0 && walletBalance < amount ? (
                    <>
                      <Button
                        onClick={() => handlePayWithRazorpay(amount - walletBalance)}
                        disabled={isProcessing || !isLoaded}
                        className="w-full bg-primary hover:bg-primary/90"
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pay Remaining ₹{(amount - walletBalance).toLocaleString('en-IN')}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        ₹{walletBalance.toFixed(2)} from wallet + ₹{(amount - walletBalance).toFixed(2)} via card/UPI
                      </p>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handlePayWithRazorpay(amount)}
                        disabled={isProcessing || !isLoaded}
                        className="w-full bg-primary hover:bg-primary/90"
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pay via Card/UPI/Net Banking
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Secure payment via Razorpay
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

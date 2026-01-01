import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, Loader2 } from "lucide-react";
import { walletService, WalletDetails } from "@/services/walletService";
import { useAuth } from "@/contexts/AuthContext";
import AddMoneyModal from "./AddMoneyModal";
import { toast } from "@/components/ui/use-toast";

const BookingWalletWidget: React.FC = () => {
  const { user } = useAuth();
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

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
      // Don't show error toast - widget should fail silently
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

  if (!user) {
    return null; // Don't show widget if user is not logged in
  }

  return (
    <>
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                {isLoading ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-foreground">
                    ₹{walletDetails?.wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddMoneyOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddMoneyModal
        open={isAddMoneyOpen}
        onOpenChange={setIsAddMoneyOpen}
        onSuccess={handleAddMoneySuccess}
      />
    </>
  );
};

export default BookingWalletWidget;


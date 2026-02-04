import React, { useState } from 'react';
import { ChevronLeft, Trash2, AlertTriangle, Info, Download, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const AccountDeletion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRequestDeletion = () => {
    toast({
      title: "Deletion Request Submitted",
      description: "We'll process your request within 30 days. You'll receive a confirmation email.",
    });
    setShowDeleteConfirm(false);
  };

  return (
    <div className="min-h-screen bg-background pt-[env(safe-area-inset-top)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">Account Deletion Policy</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 pt-20 pb-10 max-w-3xl mx-auto space-y-8">
        <div className="text-center py-8">
          <Trash2 className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-3xl font-bold mb-2">Account Deletion</h2>
          <p className="text-muted-foreground">Last updated: February 4, 2026</p>
        </div>

        {/* Important Notice */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Important Notice</h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                Account deletion is permanent and cannot be undone. All your data, including trips, stories, photos, bookings, and social connections will be permanently deleted.
              </p>
            </div>
          </div>
        </div>

        {/* What Gets Deleted */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg shrink-0">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">What Gets Deleted</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                When you delete your account, the following data will be permanently removed:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Your profile information (name, email, bio, photos)</li>
                <li>All travel stories, photos, and videos you've uploaded</li>
                <li>Trip plans, itineraries, and travel journals</li>
                <li>Club memberships and community posts</li>
                <li>Budget tracking data and expense records</li>
                <li>Saved places and favorite destinations</li>
                <li>Social connections (followers, following)</li>
                <li>Comments, likes, and interactions</li>
                <li>App settings and preferences</li>
              </ul>
            </div>
          </div>
        </section>

        {/* What Is Retained */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg shrink-0">
              <Info className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">What Is Retained (Temporarily)</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Some data may be retained for a limited time for legal and security reasons:
              </p>
              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Financial Records (7 years)</h4>
                  <p className="text-sm text-muted-foreground">
                    Transaction history and payment records are retained for tax and regulatory compliance as required by law.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Security Logs (90 days)</h4>
                  <p className="text-sm text-muted-foreground">
                    Authentication logs and security events are retained temporarily to prevent fraud and abuse.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Backup Systems (30 days)</h4>
                  <p className="text-sm text-muted-foreground">
                    Your data may persist in backup systems for up to 30 days before being permanently purged.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deletion Process */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg shrink-0">
              <Shield className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Account Deletion Process</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                To ensure security, account deletion follows these steps:
              </p>
              <ol className="space-y-3">
                <li className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">1. Submit Deletion Request</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Settings → Account → Delete Account and confirm your request with your password.
                  </p>
                </li>

                <li className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">2. Email Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    You'll receive a verification email. Click the link to confirm deletion.
                  </p>
                </li>

                <li className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">3. Grace Period (7 days)</h4>
                  <p className="text-sm text-muted-foreground">
                    Your account will be deactivated but not deleted for 7 days. You can cancel the deletion during this time by logging in.
                  </p>
                </li>

                <li className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">4. Permanent Deletion (30 days)</h4>
                  <p className="text-sm text-muted-foreground">
                    After the grace period, deletion begins. All data will be removed from active systems within 30 days.
                  </p>
                </li>

                <li className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">5. Confirmation</h4>
                  <p className="text-sm text-muted-foreground">
                    You'll receive a final confirmation email once deletion is complete.
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Before You Delete */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg shrink-0">
              <Download className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Before You Delete</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Consider these alternatives before permanently deleting your account:
              </p>
              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📥 Download Your Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Export all your travel memories, photos, and trip data before deletion (Settings → Export Data).
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">⏸️ Deactivate Temporarily</h4>
                  <p className="text-sm text-muted-foreground">
                    Hide your profile and take a break without losing your data. You can reactivate anytime.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🔒 Adjust Privacy Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Make your profile private or limit who can see your content instead of deleting everything.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <div className="border-t pt-8 mt-8">
          <h3 className="text-lg font-semibold mb-3 text-center">Need Help?</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            If you have questions about account deletion or need assistance, contact us at:
          </p>
          <p className="text-center font-medium mb-6">
            support@wandersphere.app
          </p>

          {!showDeleteConfirm ? (
            <div className="flex justify-center">
              <Button 
                variant="destructive" 
                size="lg"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Request Account Deletion
              </Button>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3 text-center">
                Are you absolutely sure?
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200 text-center mb-4">
                This action cannot be undone. All your travel memories and data will be permanently deleted.
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleRequestDeletion}
                >
                  Yes, Delete My Account
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>© 2026 WanderSphere. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
};

export default AccountDeletion;

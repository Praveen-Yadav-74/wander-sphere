import React from 'react';
import { ChevronLeft, Database, Download, Trash2, Shield, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const DataPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pt-[env(safe-area-inset-top)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">Data Policy</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 pt-20 pb-10 max-w-3xl mx-auto space-y-8">
        <div className="text-center py-8">
          <Database className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl font-bold mb-2">Your Data, Your Control</h2>
          <p className="text-muted-foreground">Last updated: February 4, 2026</p>
        </div>

        {/* What Data We Collect */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg shrink-0">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">What Data We Collect</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We collect and process the following types of data to provide you with the best travel experience:
              </p>
              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Account Information</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                    <li>Name and email address</li>
                    <li>Profile picture and cover photo</li>
                    <li>Username and bio</li>
                    <li>Password (encrypted and hashed)</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Travel Data</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                    <li>Trip details (destinations, dates, budgets)</li>
                    <li>Stories, photos, and videos you upload</li>
                    <li>Travel journal entries and reviews</li>
                    <li>Club memberships and activities</li>
                    <li>Booking history and preferences</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Location Data</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                    <li>GPS coordinates when you use map features</li>
                    <li>Location tags on stories and posts</li>
                    <li>Travel route history (when tracking is enabled)</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Device Information</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                    <li>Device type and operating system</li>
                    <li>App version and settings</li>
                    <li>IP address and browser information</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How We Use Your Data */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg shrink-0">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">How We Use Your Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Your data helps us provide and improve our services:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Personalize your travel recommendations and content</li>
                <li>Connect you with other travelers and communities</li>
                <li>Process bookings and manage transactions</li>
                <li>Improve app features based on usage patterns</li>
                <li>Send important notifications about your trips</li>
                <li>Provide customer support and resolve issues</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Retention */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg shrink-0">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Data Retention</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We retain your data as follows:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Account data:</strong> Retained while your account is active</li>
                <li><strong>Travel content:</strong> Stored until you delete it or close your account</li>
                <li><strong>Transaction records:</strong> Kept for 7 years for regulatory compliance</li>
                <li><strong>Analytics data:</strong> Aggregated and anonymized after 90 days</li>
                <li><strong>Deleted data:</strong> Removed from active systems within 30 days</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="space-y-4">
          <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Data Sharing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We do not sell your personal data. We only share data in these limited circumstances:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4">
              <li><strong>With your consent:</strong> When you choose to share stories or join clubs</li>
              <li><strong>Service providers:</strong> Payment processors, map providers, analytics services (under strict agreements)</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business transfers:</strong> In case of merger or acquisition (you'll be notified)</li>
            </ul>
          </div>
        </section>

        {/* Your Data Rights */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg shrink-0">
              <Download className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Your Data Rights</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You have complete control over your data:
              </p>
              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">✓ Access Your Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download a complete copy of all your data at any time through Settings → Account → Export Data
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">✓ Correct Your Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Update your profile, preferences, and content directly in the app
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">✓ Delete Your Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Remove individual stories, trips, or permanently delete your entire account
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">✓ Restrict Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Opt out of marketing, analytics, or location tracking in Settings
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">✓ Data Portability</h4>
                  <p className="text-sm text-muted-foreground">
                    Export your data in a machine-readable format (JSON) to use elsewhere
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <div className="border-t pt-8 mt-8">
          <h3 className="text-lg font-semibold mb-3 text-center">Questions About Your Data?</h3>
          <p className="text-sm text-muted-foreground text-center">
            For data-related inquiries, requests, or concerns, contact us at:
          </p>
          <p className="text-center mt-2 font-medium">
            data@wandersphere.app
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>© 2026 WanderSphere. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
};

export default DataPolicy;

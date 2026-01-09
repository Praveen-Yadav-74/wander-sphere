import React from 'react';
import { ChevronLeft, Shield, Lock, Eye, Server, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pt-[env(safe-area-inset-top)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 pt-20 pb-10 max-w-3xl mx-auto space-y-8">
        <div className="text-center py-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl font-bold mb-2">We value your privacy</h2>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </div>

        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg shrink-0">
              <Eye className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Data Collection</h3>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us when you create an account, create a profile, post content, or communicate with us. This may include your name, email address, profile photo, and travel preferences.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg shrink-0">
              <Lock className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Data Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg shrink-0">
              <Server className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Data Usage</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to operate, maintain, and provide the features of the WanderSphere platform. We may also use this information to communicate with you about updates, promotions, and news.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg shrink-0">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Your Rights</h3>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, correct, or delete your personal data. You can manage your privacy settings directly within the app or contact our support team for assistance.
              </p>
            </div>
          </div>
        </section>

        <div className="border-t pt-8 mt-8">
          <p className="text-sm text-muted-foreground text-center">
            If you have any questions about this Privacy Policy, please contact us at privacy@wandersphere.app
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;

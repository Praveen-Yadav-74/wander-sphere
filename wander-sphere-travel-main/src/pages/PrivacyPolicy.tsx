import React from 'react';
import { ChevronLeft, Shield, Camera, MapPin, Image, Lock, Eye, Server, FileText, Smartphone } from 'lucide-react';
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
          <p className="text-muted-foreground">Last updated: February 4, 2026</p>
        </div>

        {/* Mobile App Permissions Section */}
        <section className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold">Mobile App Permissions</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Our mobile app requests certain permissions to provide you with the best travel experience. Below are the permissions we use and why:
          </p>
        </section>

        {/* Camera Permission */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg shrink-0">
              <Camera className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Camera Access</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We access your device camera to enable you to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Capture photos and videos for your travel stories</li>
                <li>Upload profile pictures and cover photos</li>
                <li>Share moments from your trips with the community</li>
                <li>Document your travel experiences in real-time</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3 italic">
                Camera access is optional and only activated when you choose to take or upload photos.
              </p>
            </div>
          </div>
        </section>

        {/* Location Permission */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg shrink-0">
              <MapPin className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Location Access</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We access your location to provide:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Interactive travel maps showing your journeys</li>
                <li>Location-based trip recommendations and nearby attractions</li>
                <li>Real-time location tracking for active trips (when enabled)</li>
                <li>Automatic geotagging of your travel stories and posts</li>
                <li>Distance calculations and route planning</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3 italic">
                Location data is only collected when you use location-based features and can be disabled in your device settings.
              </p>
            </div>
          </div>
        </section>

        {/* Storage/Media Permission */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg shrink-0">
              <Image className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Storage & Media Access</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We access your device storage and media to allow you to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Select photos and videos from your gallery to share</li>
                <li>Upload media content to your stories and trip journals</li>
                <li>Save and cache travel guides and maps for offline use</li>
                <li>Store trip data and booking confirmations locally</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3 italic">
                We only access media files that you explicitly select for upload. We never scan or access your entire photo library without permission.
              </p>
            </div>
          </div>
        </section>

        {/* Data Collection */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg shrink-0">
              <Eye className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Data Collection</h3>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us when you create an account, create a profile, post content, or communicate with us. This may include your name, email address, profile photo, travel preferences, trip details, and user-generated content such as stories, photos, and reviews.
              </p>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg shrink-0">
              <Lock className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Data Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All data transmissions are encrypted using industry-standard SSL/TLS protocols. Photos, location data, and personal information are stored securely and are never shared with third parties without your explicit consent.
              </p>
            </div>
          </div>
        </section>

        {/* Data Usage */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-500/10 rounded-lg shrink-0">
              <Server className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Data Usage</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to operate, maintain, and provide the features of the WanderSphere platform. This includes personalizing your experience, connecting you with other travelers, providing trip recommendations, processing bookings, and improving our services. We may also use this information to communicate with you about updates, promotions, and news.
              </p>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg shrink-0">
              <FileText className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Your Rights</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You have full control over your personal data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access and download your personal data at any time</li>
                <li>Correct or update your information through app settings</li>
                <li>Delete your account and associated data permanently</li>
                <li>Opt-out of marketing communications</li>
                <li>Revoke app permissions from your device settings</li>
                <li>Request a copy of all data we have about you</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Third-Party Services */}
        <section className="space-y-4">
          <div className="p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Third-Party Services</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may use third-party service providers (such as payment processors, map providers, and analytics services) to help us operate our platform. These providers have access only to the information necessary to perform their functions and are obligated to protect your data according to our privacy standards.
            </p>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="space-y-4">
          <div className="p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Children's Privacy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              WanderSphere is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </div>
        </section>

        {/* Changes to Privacy Policy */}
        <section className="space-y-4">
          <div className="p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Changes to This Privacy Policy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
          </div>
        </section>

        {/* Contact */}
        <div className="border-t pt-8 mt-8">
          <h3 className="text-lg font-semibold mb-3 text-center">Contact Us</h3>
          <p className="text-sm text-muted-foreground text-center">
            If you have any questions about this Privacy Policy or how we handle your data, please contact us at:
          </p>
          <p className="text-center mt-2 font-medium">
            privacy@wandersphere.app
          </p>
        </div>

        {/* Company Info */}
        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>© 2026 WanderSphere. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;

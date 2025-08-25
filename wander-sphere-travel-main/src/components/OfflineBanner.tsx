/**
 * Offline Banner Component
 * Shows a banner when the app is offline with appropriate messaging
 */

import React from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import { useNetworkStatus, useDeviceType } from '@/utils/networkUtils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineBannerProps {
  onRetry?: () => void;
  dismissible?: boolean;
  className?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  onRetry,
  dismissible = true,
  className = ''
}) => {
  const isOnline = useNetworkStatus();
  const deviceType = useDeviceType();
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);

  // Reset dismissed state when coming back online
  React.useEffect(() => {
    if (isOnline) {
      setIsDismissed(false);
      setIsRetrying(false);
    }
  }, [isOnline]);

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } catch (error) {
        console.warn('Retry failed:', error);
      } finally {
        setIsRetrying(false);
      }
    } else {
      // Default retry behavior - reload the page
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const getMessage = () => {
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      return {
        title: 'You\'re offline',
        description: 'Showing cached content. Your changes will sync when you\'re back online.'
      };
    } else {
      return {
        title: 'No internet connection',
        description: 'Please check your network connection and try again.'
      };
    }
  };

  const message = getMessage();

  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 right-0 z-50 ${className}`}
      >
        <Alert className="rounded-none border-x-0 border-t-0 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
          <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="flex items-center justify-between w-full">
            <div className="flex-1">
              <div className="font-medium text-orange-800 dark:text-orange-200">
                {message.title}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                {message.description}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {/* Retry Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying}
                className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
              
              {/* Dismiss Button */}
              {dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineBanner;
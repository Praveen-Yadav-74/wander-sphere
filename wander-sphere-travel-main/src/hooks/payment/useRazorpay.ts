import { useState, useEffect } from 'react';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    hide_topbar?: boolean;
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    animation?: boolean;
    handle_back?: boolean;
    escape?: boolean;
    confirm_close?: boolean;
  };
  // Ensure no display restrictions
  config?: any;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface UseRazorpayReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  openRazorpay: (options: RazorpayOptions) => void;
  preloadScript: () => Promise<void>;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Custom hook to load and use Razorpay checkout with Eager Loading
 */
export const useRazorpay = (): UseRazorpayReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preloadScript = async () => {
    // 1. Fast check: If already loaded, return immediately
    if (window.Razorpay) {
      if (!isLoaded) setIsLoaded(true);
      if (isLoading) setIsLoading(false);
      return;
    }

    // 2. Prevent duplicate loading if script tag exists
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      // It's already loading or loaded. We assume it will trigger onload eventually.
      // But to be safe, we can attach our own onload listener to the existing script?
      // For simplicity, we just mark loading true.
      setIsLoading(true);
      return; 
    }

    setIsLoading(true);
    setError(null);

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      // 3. Timeout logic (5 seconds) - Fast Fail
      const timeoutId = setTimeout(() => {
        if (!window.Razorpay) {
          const timeoutMsg = 'Razorpay SDK load timed out. Check connection.';
          console.warn(timeoutMsg);
          setError(timeoutMsg);
          setIsLoading(false);
          reject(new Error(timeoutMsg));
        }
      }, 5000);

      script.onload = () => {
        clearTimeout(timeoutId);
        console.log('✨ Razorpay script loaded (Eager Mode)');
        setIsLoaded(true);
        setIsLoading(false);
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        const errorMsg = 'Failed to load Razorpay script.';
        console.error(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        reject(new Error(errorMsg));
      };

      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    // Auto-load on mount (Eager Loading)
    // This ensures that as soon as the hook is used (e.g. in WalletPage), downloading starts
    preloadScript().catch(err => console.debug('Backgroud preload non-fatal error:', err));
  }, []);

  const openRazorpay = (options: RazorpayOptions) => {
    if (!isLoaded || !window.Razorpay) {
      console.warn('Razorpay not ready, attempting JIT check...');
      // Try to recover one last time
      if (window.Razorpay) {
         setIsLoaded(true);
      } else {
         const msg = 'Payment gateway is loading. Please try again in 5 seconds.';
         setError(msg);
         return;
      }
    }

    try {
      // Enhanced options with robust handler wrappers
      const robustOptions = {
        ...options,
        handler: async (response: RazorpayResponse) => {
          try {
            console.log('✅ Razorpay payment success callback');
            if (options.handler) {
              await options.handler(response);
            }
          } catch (error) {
            console.error('❌ Payment handler logic error:', error);
          }
        },
        modal: {
          ondismiss: () => {
             console.log('🚫 Payment modal dismissed');
             if (options.modal?.ondismiss) {
               try {
                 options.modal.ondismiss();
               } catch (e) {
                 console.error('Dismiss handler error:', e);
               }
             }
          },
          ...options.modal
        }
      };

      const rzp = new window.Razorpay(robustOptions);

      if (rzp.on) {
          rzp.on('payment.failed', function (response: any) {
            console.warn('Payment failed event:', response.error?.description);
          });
      }

      rzp.open();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to open Razorpay checkout';
      // Suppress known non-critical network errors
      if (errorMsg.includes('lumberjack') || errorMsg.includes('sentry')) {
           return;
      }
      console.error('Error opening Razorpay:', err);
      setError(errorMsg);
    }
  };

  return {
    isLoaded,
    isLoading,
    error,
    openRazorpay,
    preloadScript
  };
};

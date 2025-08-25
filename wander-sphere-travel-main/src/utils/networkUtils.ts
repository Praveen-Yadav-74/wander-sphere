/**
 * Network and device utilities for handling online/offline states
 */

import { useState, useEffect } from 'react';

// Network status detection
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Device type detection
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for mobile user agents
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Check for touch capability and screen size
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  
  return mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen);
};

// Check if device is specifically mobile (not tablet)
export const isMobile = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?=.*\bMobile\b)(?!.*\bTablet\b)|KFAPWI/i;
  
  return mobileRegex.test(userAgent) && !tabletRegex.test(userAgent);
};

// Check if device is tablet
export const isTablet = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const tabletRegex = /iPad|Android(?!.*\bMobile\b)|KFAPWI/i;
  
  return tabletRegex.test(userAgent);
};

// Check if device is desktop
export const isDesktop = (): boolean => {
  return !isMobileDevice();
};

// Network quality detection (basic)
export const getNetworkQuality = (): 'slow' | 'fast' | 'unknown' => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'unknown';
  
  const { effectiveType, downlink } = connection;
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 0.5) {
    return 'slow';
  }
  
  return 'fast';
};

// React hook for device type
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
    if (isMobile()) return 'mobile';
    if (isTablet()) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      if (isMobile()) setDeviceType('mobile');
      else if (isTablet()) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};
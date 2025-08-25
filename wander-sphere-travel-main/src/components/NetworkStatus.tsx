/**
 * Network Status Component
 * Shows offline/online status and cache information
 */

import React from 'react';
import { Wifi, WifiOff, Database, Clock, Smartphone, Monitor } from 'lucide-react';
import { useNetworkStatus, useDeviceType } from '@/utils/networkUtils';
import { getCacheStats } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NetworkStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const isOnline = useNetworkStatus();
  const deviceType = useDeviceType();
  const [cacheStats, setCacheStats] = React.useState<ReturnType<typeof getCacheStats> | null>(null);

  React.useEffect(() => {
    const updateCacheStats = () => {
      try {
        setCacheStats(getCacheStats());
      } catch (error) {
        console.warn('Failed to get cache stats:', error);
      }
    };

    updateCacheStats();
    const interval = setInterval(updateCacheStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-3 w-3" />;
      case 'tablet':
        return <Smartphone className="h-3 w-3" />;
      default:
        return <Monitor className="h-3 w-3" />;
    }
  };

  const formatCacheSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getLastCacheUpdate = (): string => {
    if (!cacheStats?.oldestItem) return 'No cache';
    const now = Date.now();
    const diff = now - cacheStats.oldestItem;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!showDetails) {
    // Simple status indicator
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={`flex items-center gap-1 ${className}`}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              {getDeviceIcon()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">
                {isOnline ? 'Online' : 'Offline'} • {deviceType}
              </div>
              {!isOnline && cacheStats && (
                <div className="text-xs text-muted-foreground mt-1">
                  {cacheStats.totalItems} cached items
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed status card
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Network Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <Badge variant={isOnline ? 'default' : 'secondary'}>
              {deviceType}
            </Badge>
          </div>

          {/* Cache Information */}
          {cacheStats && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>Cache Status</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Items:</span>
                  <span className="ml-1 font-medium">{cacheStats.totalItems}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <span className="ml-1 font-medium">{formatCacheSize(cacheStats.totalSize)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Last update: {getLastCacheUpdate()}</span>
              </div>
            </div>
          )}

          {/* Offline Mode Message */}
          {!isOnline && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              {deviceType === 'mobile' || deviceType === 'tablet' ? (
                'Using cached data. Changes will sync when online.'
              ) : (
                'Network connection required for full functionality.'
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkStatus;
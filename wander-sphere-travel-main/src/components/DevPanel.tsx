import { useState } from 'react';
import { Settings, User, Database, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface DevPanelProps {
  onBypassAuth?: () => void;
  onClearStorage?: () => void;
}

const DevPanel = ({ onBypassAuth, onClearStorage }: DevPanelProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mockDataEnabled, setMockDataEnabled] = useState(true);
  const [apiLoggingEnabled, setApiLoggingEnabled] = useState(true);

  if (!import.meta.env.DEV) {
    return null;
  }

  const handleBypassAuth = () => {
    // Create a mock user for development
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@wandersphere.com',
      username: 'developer',
      firstName: 'Dev',
      lastName: 'User',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Development user for testing',
      location: 'Development Environment',
      isVerified: true,
      isOnline: true,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
          tripUpdates: true,
          friendRequests: true,
          messages: true,
          promotions: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          showLocation: true,
          allowFriendRequests: true,
          allowMessages: true
        },
        travelPreferences: {
          budgetRange: { min: 0, max: 5000 },
          preferredDestinations: ['Japan', 'Iceland', 'New Zealand'],
          travelStyle: 'mid-range',
          accommodationType: ['hotel', 'airbnb'],
          transportModes: ['flight', 'train'],
          interests: ['photography', 'hiking', 'culture']
        }
      },
      stats: {
        tripsCompleted: 12,
        countriesVisited: 8,
        citiesVisited: 25,
        totalDistance: 45000,
        totalSpent: 15000,
        friendsCount: 42,
        followersCount: 128,
        followingCount: 95,
        reviewsCount: 18,
        averageRating: 4.7
      }
    };
    
    localStorage.setItem('dev-bypass-auth', 'true');
    localStorage.setItem('dev-user', JSON.stringify(mockUser));
    onBypassAuth?.();
  };

  const handleClearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    onClearStorage?.();
    window.location.reload();
  };

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(!isVisible)}
          size="sm"
          variant="outline"
          className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Dev Panel */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 z-50 w-80">
          <Card className="bg-white/95 backdrop-blur-sm border-yellow-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Development Panel
                <Badge variant="secondary" className="text-xs">
                  DEV
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Auth Controls */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700">Authentication</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBypassAuth}
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                  >
                    <User className="w-3 h-3 mr-1" />
                    Bypass Auth
                  </Button>
                  <Button
                    onClick={handleClearStorage}
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                  >
                    <Database className="w-3 h-3 mr-1" />
                    Clear Storage
                  </Button>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700">Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Mock Data</span>
                    <Switch
                      checked={mockDataEnabled}
                      onCheckedChange={setMockDataEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">API Logging</span>
                    <Switch
                      checked={apiLoggingEnabled}
                      onCheckedChange={setApiLoggingEnabled}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700">Status</h4>
                <div className="flex items-center gap-2 text-xs">
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-gray-600">Connected</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Database className="w-3 h-3 text-blue-500" />
                  <span className="text-gray-600">Supabase Ready</span>
                </div>
              </div>

              {/* Hide Button */}
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
                className="w-full text-xs"
              >
                <EyeOff className="w-3 h-3 mr-1" />
                Hide Panel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default DevPanel;
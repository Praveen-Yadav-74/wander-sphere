import { useState, useEffect } from 'react';
import { Loader2, Compass, MapPin, Camera, Users, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TroubleshootingModal from './TroubleshootingModal';

interface LoadingScreenProps {
  onSkip?: () => void;
  onBypassAuth?: () => void;
  onClearData?: () => void;
}

const LoadingScreen = ({ onSkip, onBypassAuth, onClearData }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  
  const steps = [
    { icon: Compass, text: 'Preparing your journey...' },
    { icon: MapPin, text: 'Loading destinations...' },
    { icon: Camera, text: 'Setting up memories...' },
    { icon: Users, text: 'Connecting travelers...' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 1500);

    // Show skip button after 5 seconds to help users with loading issues
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
      clearTimeout(skipTimer);
    };
  }, []);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center space-y-6 p-8 max-w-md mx-auto">
        {/* Logo and Spinner */}
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <CurrentIcon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        {/* App Name */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            WanderSphere
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Your Travel Companion
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            {progress}% Complete
          </p>
        </div>

        {/* Current Step */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">
            {steps[currentStep].text}
          </p>
        </div>

        {/* Skip Button */}
        {showSkip && (
          <div className="flex gap-2 mt-8">
            <Button 
              onClick={() => setShowTroubleshooting(true)}
              variant="outline"
              size="sm"
              className="text-xs bg-white/10 border-white/20 text-blue-600 hover:bg-white/20"
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              Troubleshoot
            </Button>
            {onSkip && (
              <Button 
                onClick={onSkip}
                variant="outline"
                size="sm"
                className="text-xs bg-white/10 border-white/20 text-blue-600 hover:bg-white/20"
              >
                Skip to Login
              </Button>
            )}
          </div>
        )}

        {/* Development Mode Indicator */}
        {import.meta.env.DEV && (
          <div className="absolute bottom-4 right-4">
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
              DEV MODE
            </span>
          </div>
        )}
      </div>
      
      <TroubleshootingModal 
        isOpen={showTroubleshooting}
        onClose={() => setShowTroubleshooting(false)}
        onBypassAuth={() => {
          onBypassAuth?.();
          setShowTroubleshooting(false);
        }}
        onClearData={() => {
          onClearData?.();
          setShowTroubleshooting(false);
        }}
      />
    </div>
  );
};

export default LoadingScreen;
import { useState } from 'react';
import { AlertTriangle, Wifi, RefreshCw, Settings, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBypassAuth?: () => void;
  onClearData?: () => void;
}

const TroubleshootingModal = ({ isOpen, onClose, onBypassAuth, onClearData }: TroubleshootingModalProps) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  if (!isOpen) return null;

  const troubleshootingSteps = [
    {
      id: 1,
      title: 'Check Internet Connection',
      description: 'Ensure you have a stable internet connection',
      icon: Wifi,
      action: () => {
        // Check if online
        if (navigator.onLine) {
          setCompletedSteps(prev => [...prev, 1]);
        } else {
          alert('No internet connection detected. Please check your network.');
        }
      }
    },
    {
      id: 2,
      title: 'Clear Browser Data',
      description: 'Clear cached authentication data',
      icon: RefreshCw,
      action: () => {
        onClearData?.();
        setCompletedSteps(prev => [...prev, 2]);
      }
    },
    {
      id: 3,
      title: 'Refresh Page',
      description: 'Reload the application',
      icon: RefreshCw,
      action: () => {
        window.location.reload();
      }
    },
    {
      id: 4,
      title: 'Development Bypass',
      description: 'Skip authentication for testing (Development only)',
      icon: Settings,
      action: () => {
        onBypassAuth?.();
        setCompletedSteps(prev => [...prev, 4]);
      },
      devOnly: true
    }
  ];

  const isStepCompleted = (stepId: number) => completedSteps.includes(stepId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Loading Issues?
            </CardTitle>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Try these troubleshooting steps to resolve loading issues:
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {troubleshootingSteps.map((step) => {
            if (step.devOnly && !import.meta.env.DEV) return null;
            
            const Icon = step.icon;
            const completed = isStepCompleted(step.id);
            
            return (
              <div
                key={step.id}
                className={`p-3 border rounded-lg transition-colors ${
                  completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    completed ? 'bg-green-100' : 'bg-white'
                  }`}>
                    {completed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Icon className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{step.title}</h4>
                      {step.devOnly && (
                        <Badge variant="secondary" className="text-xs">
                          DEV
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {step.description}
                    </p>
                    <Button
                      onClick={step.action}
                      size="sm"
                      variant={completed ? "outline" : "default"}
                      className="text-xs h-7"
                      disabled={completed}
                    >
                      {completed ? 'Completed' : 'Try This'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500 text-center">
              Still having issues? Try refreshing the page or contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TroubleshootingModal;
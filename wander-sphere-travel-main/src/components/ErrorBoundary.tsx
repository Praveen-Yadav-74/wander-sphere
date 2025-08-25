import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto my-8 bg-red-50/50 shadow-lg">
          <CardHeader className="bg-red-50 text-red-700">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-4">
              {this.state.error && (
                <p className="font-medium mb-2">{this.state.error.toString()}</p>
              )}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 p-2 bg-gray-50/50 rounded-lg shadow-sm">
                  <summary className="cursor-pointer text-sm font-medium">Stack trace</summary>
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-100 rounded">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 bg-gray-50">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Button 
              onClick={this.resetErrorBoundary}
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
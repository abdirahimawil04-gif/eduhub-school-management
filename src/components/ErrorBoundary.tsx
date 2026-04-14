import React, { useState, useEffect, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

export function ErrorBoundary({ children }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  const handleReset = () => {
    setHasError(false);
    setError(null);
    window.location.reload();
  };

  if (hasError) {
    let errorMessage = "An unexpected error occurred.";
    let isPermissionError = false;

    try {
      if (error?.message) {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.includes('permissions')) {
          errorMessage = "You don't have permission to perform this action or access this data.";
          isPermissionError = true;
        }
      }
    } catch (e) {
      errorMessage = error?.message || errorMessage;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full border-red-100 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-red-600 w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              {isPermissionError ? "Access Denied" : "Something went wrong"}
            </CardTitle>
            <CardDescription className="mt-2 text-slate-600">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-8">
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

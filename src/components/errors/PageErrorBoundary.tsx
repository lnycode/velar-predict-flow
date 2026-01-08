import React, { ReactNode } from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PageErrorBoundaryProps {
  children?: ReactNode;
}

export function PageErrorBoundary({ children }: PageErrorBoundaryProps) {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Etwas ist schiefgelaufen';
  let description = 'Ein unerwarteter Fehler ist aufgetreten.';
  let statusCode: number | undefined;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    switch (error.status) {
      case 404:
        title = 'Seite nicht gefunden';
        description = 'Die angeforderte Seite existiert nicht.';
        break;
      case 403:
        title = 'Zugriff verweigert';
        description = 'Sie haben keine Berechtigung, diese Seite anzuzeigen.';
        break;
      case 500:
        title = 'Serverfehler';
        description = 'Ein interner Serverfehler ist aufgetreten.';
        break;
      default:
        description = error.statusText || description;
    }
  } else if (error instanceof Error) {
    description = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            {statusCode ? (
              <span className="text-2xl font-bold text-destructive">{statusCode}</span>
            ) : (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Startseite
            </Button>
          </div>
          <Button
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Seite neu laden
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

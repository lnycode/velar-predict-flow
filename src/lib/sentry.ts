import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  // Only initialize if DSN is configured
  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.log('Sentry: No DSN configured, skipping initialization');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out common non-actionable errors
    beforeSend(event, hint) {
      const error = hint.originalException as Error;
      
      // Ignore network errors from user's connection issues
      if (error?.message?.includes('Failed to fetch')) {
        return null;
      }
      
      // Ignore ResizeObserver errors (browser quirk)
      if (error?.message?.includes('ResizeObserver')) {
        return null;
      }

      return event;
    },

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
  });
}

// Helper to capture errors with additional context
export function captureError(
  error: Error,
  context?: Record<string, unknown>
) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to set user context
export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
}

// Helper to clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Helper to add breadcrumb for debugging
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

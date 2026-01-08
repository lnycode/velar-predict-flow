import { captureError, addBreadcrumb } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDev = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.debug(this.formatMessage('debug', message, context));
    }
    addBreadcrumb(message, 'debug', context);
  }

  info(message: string, context?: LogContext) {
    if (this.isDev) {
      console.info(this.formatMessage('info', message, context));
    }
    addBreadcrumb(message, 'info', context);
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
    addBreadcrumb(message, 'warning', context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    console.error(this.formatMessage('error', message, context), error);
    
    if (error) {
      captureError(error, {
        message,
        ...context,
      });
    }
  }

  // Track user actions for debugging
  action(action: string, details?: LogContext) {
    this.info(`User action: ${action}`, details);
  }

  // Track API calls
  api(method: string, endpoint: string, status?: number, duration?: number) {
    this.debug(`API ${method} ${endpoint}`, { status, duration });
  }

  // Track page views
  pageView(path: string) {
    this.info('Page view', { path });
  }
}

export const logger = new Logger();

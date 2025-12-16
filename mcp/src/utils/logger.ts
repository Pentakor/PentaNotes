import { NODE_ENV } from '../config/env';

// ---------------------------
// Log Levels
// ---------------------------
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// ---------------------------
// Log Entry Interface
// ---------------------------
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ---------------------------
// Logger Class
// ---------------------------
class Logger {
  private isDevelopment = NODE_ENV === 'development';

  /**
   * Get current timestamp in local timezone
   */
  private getTimestamp(): string {
    return new Date().toLocaleString('en-IL', { 
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Format log entry as structured JSON
   */
  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  /**
   * Format log entry as readable string (for development)
   */
  private formatReadable(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    let output = `[${timestamp}] [${level}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`;
    }

    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`;
      if (error.stack && this.isDevelopment) {
        output += `\n${error.stack}`;
      }
    }

    return output;
  }

  /**
   * Output log to console
   */
  private output(entry: LogEntry): void {
    const formatted = this.isDevelopment
      ? this.formatReadable(entry)
      : this.formatLog(entry);

    if (entry.level === LogLevel.ERROR) {
      console.error(formatted);
    } else if (entry.level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.output({
        timestamp: this.getTimestamp(),
        level: LogLevel.DEBUG,
        message,
        context,
      });
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.output({
      timestamp: this.getTimestamp(),
      level: LogLevel.INFO,
      message,
      context,
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.output({
      timestamp: this.getTimestamp(),
      level: LogLevel.WARN,
      message,
      context,
    });
  }

  /**
   * Log error message with error object
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.output({
      timestamp: this.getTimestamp(),
      level: LogLevel.ERROR,
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  /**
   * Log HTTP request
   */
  http(
    method: string,
    url: string,
    status?: number,
    duration?: number
  ): void {
    const context: Record<string, any> = { method, url };
    if (status) context.status = status;
    if (duration) context.durationMs = duration;

    this.info(`HTTP ${method} ${url}`, context);
  }

  /**
   * Log function call
   */
  functionCall(name: string, args?: Record<string, any>): void {
    this.debug(`Function called: ${name}`, args);
  }

  /**
   * Log function result
   */
  functionResult(name: string, result?: any): void {
    this.debug(`Function returned: ${name}`, { result });
  }
}

// Export singleton instance
export const logger = new Logger();

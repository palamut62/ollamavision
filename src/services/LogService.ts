import { eventBus } from './EventBus';

type LogLevel = 'info' | 'warning' | 'error' | 'success';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: Date;
}

class LogService {
  private static instance: LogService;
  private logs: LogMessage[] = [];

  private constructor() {}

  static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  log(level: LogLevel, message: string) {
    const logMessage = {
      level,
      message,
      timestamp: new Date()
    };

    this.logs.push(logMessage);
    
    // Terminal'e log gönder
    const color = this.getColorForLevel(level);
    const timestamp = this.formatTimestamp(logMessage.timestamp);
    const formattedMessage = `\x1b[90m${timestamp}\x1b[0m ${color}[${level.toUpperCase()}]\x1b[0m ${message}\r\n`;
    
    eventBus.emit('terminal-log', formattedMessage);
  }

  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case 'info':
        return '\x1b[36m'; // Cyan
      case 'warning':
        return '\x1b[33m'; // Yellow
      case 'error':
        return '\x1b[31m'; // Red
      case 'success':
        return '\x1b[32m'; // Green
      default:
        return '\x1b[0m'; // Reset
    }
  }

  private formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  info(message: string) {
    this.log('info', message);
  }

  warning(message: string) {
    this.log('warning', message);
  }

  error(message: string) {
    this.log('error', message);
  }

  success(message: string) {
    this.log('success', message);
  }

  getLogs(): LogMessage[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }
}

export const logger = LogService.getInstance(); 
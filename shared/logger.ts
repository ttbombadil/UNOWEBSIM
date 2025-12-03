// UnoSim/shared/logger.ts

export type LogLevel = 'TEST' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export class Logger {
  private sender: string;

  constructor(sender: string) {
    this.sender = sender;
  }

  private log(level: LogLevel, message: string) {
    if (level === 'TEST') {
      // Nur die Message ausgeben
      console.log(message);
    } else {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}][${level}][${this.sender}] ${message}`);
    }
  }

  test(message: string) {
    this.log('TEST', message);
  }

  info(message: string) {
    this.log('INFO', message);
  }

  warn(message: string) {
    this.log('WARN', message);
  }

  error(message: string) {
    this.log('ERROR', message);
  }

  debug(message: string) {
    this.log('DEBUG', message);
  }
}
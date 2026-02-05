
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private name: string;
  private minLevel: LogLevel;

  constructor(name: string, minLevel: LogLevel = LogLevel.INFO) {
    this.name = name;
    this.minLevel = minLevel;
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (level < this.minLevel) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const formattedMessage = `[${timestamp}] [${this.name}] [${levelName}] ${message}`;

    if (level >= LogLevel.ERROR) {
      console.error(formattedMessage, ...args);
    } else {
      console.error(formattedMessage, ...args); // MCP uses stderr for logging, stdout for protocol
    }
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

import { OutputChannel, window } from 'vscode';

export const isDebugMode = process.env.VSCODE_DEBUG_MODE === 'true';

export interface ILogger {
  info(message: string): void;
  error(message: string): void;
  debug(message: string): void;
  push(message: string): ILogger;
}

class Logger implements ILogger {
  private channel: OutputChannel | undefined;
  private buffer: string[];

  constructor() { this.buffer = []; }

  debug(message: string): void { if (isDebugMode) this.log(`DEBUG`, message); }
  info(message: string): void { this.log(`INFO`, message); }
  error(message: string): void { this.log(`!ERROR`, message); }

  push(message: string): ILogger {
    this.buffer.push(message);
    return this;
  }

  private log(prefix: string, message: string) {
    if (!this.channel) this.channel = window.createOutputChannel('Markdown Fiction Writer');
    if (!this.channel) return;  // If channel coulnd not be crated, just ignore it

    const date = new Date().toISOString().replace('T', ' ').slice(0, -5);

    if (isDebugMode) {
      this.channel.appendLine(`[${prefix}] ${message}`);
      this.buffer.forEach(line => { if (this.channel) this.channel.appendLine(`${line}`); });
    } else {
      this.channel.appendLine(`[${date}] [${prefix}]`);
      this.channel.appendLine(`  ${message}`);
      this.buffer.forEach(line => { if (this.channel) this.channel.appendLine(`  ${line}`); });
    }
    this.buffer = [];
  }
}

export const logger = new Logger();
import  {OutputChannel, window} from 'vscode';

export const isDebugMode = process.env.VSCODE_DEBUG_MODE === 'true';

export interface ILogger {
	info(message: string): void;
	error(message: string): void;
	push(message: string): ILogger;
}

class Logger implements ILogger {
	private channel : OutputChannel | undefined;
	private buffer: string[];

	constructor() { this.buffer = []; }


	private log(prefix: string, message: string){
		if (!this.channel) this.channel = window.createOutputChannel('Markdown Fiction Writer');
		const date = new Date().toISOString().replace('T', ' ').slice(0, -5);

		if (isDebugMode) {
			this.channel.appendLine(`[${prefix}] ${message}`);
			this.buffer.forEach(line => {if (this.channel) this.channel.appendLine(`${line}`); });
		} else {
			this.channel.appendLine(`[${date}] [${prefix}]`);
			this.channel.appendLine(`  ${message}`);
			this.buffer.forEach(line => {if (this.channel) this.channel.appendLine(`  ${line}`); });
		}
		this.buffer = [];
	}

	push (message: string): ILogger {
		this.buffer.push(message);
		return this;
	}
	info(message: string): void {
		this.log(`INFO`, message);
	}

	error(message: string): void {
		this.log(`!ERROR`, message);
	}

}

export const logger = isDebugMode? new Logger() : new Logger();
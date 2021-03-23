/**
 * Module mock for 'vscode'.
 * Add here all vscode.* members that are used by codebase under test
 * 
 * @remarks
 * Only used by jest tests.
 */

export const workspace = {
	getConfiguration: jest.fn(),
	workspaceFolders: [],
	onDidSaveTextDocument: jest.fn(),
  };

export const window = {
	activeTextEditor: {},
	createOutputChannel: jest.fn()
};

export class TreeItem {
	constructor(a: string, b:string){}
}
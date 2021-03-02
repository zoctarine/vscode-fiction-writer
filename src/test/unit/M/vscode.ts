export const workspace = {
	getConfiguration: jest.fn(),
	workspaceFolders: [],
	onDidSaveTextDocument: jest.fn(),
  };

export const window = {
	activeTextEditor: {}
};

export class TreeItem {
	constructor(a: string, b:string){}
}
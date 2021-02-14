import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CompileFileCommand } from './CompileFileCommand';
import { Config } from '../config';
import { IObservable } from '../observable';

export class CompileTocCommand extends CompileFileCommand {

  constructor(config: IObservable<Config>) {
    super(config);
  }

  protected makeToc(inputs: Array<string>, errors: Array<string>)
    : { includePath: string, text: string, success: boolean } {
    try {
      let toc = '';

      // First, try to get TOC from current folder;
      const file = path.parse(inputs[0]);
      const tocInDir = path.join(file.dir, this.state.compileTocFilename);

      if (fs.existsSync(tocInDir)) {
        toc = tocInDir;
      } else {
        // Try to get toc from workspace folder;
        let doc = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(inputs[0]));
        if (doc) {
          const tocInWorkspace = path.join(doc.uri.fsPath, this.state.compileTocFilename);
          if (fs.existsSync(tocInWorkspace)) {
            toc = tocInWorkspace;
          }
        }
      }
      if (toc !== '') {
        return {
          includePath: path.parse(toc).dir,
          text: fs.readFileSync(toc, 'UTF-8'),
          success: true
        };
      } else {
        throw new Error('cannot find toc');
      }
    } catch {
      errors.push(`Cannod find ${this.state.compileTocFilename} file. In current folder or workspace.`);
      return { includePath: '', text: '', success: false };
    }
  }

  protected async convertAndOpen(editor: vscode.TextEditor, inputs: Array<string>, outputName?: string, format?: string) {
    const parsedToc = path.parse(this.state.compileTocFilename);
    await super.convertAndOpen(editor, inputs, parsedToc.name, format);
  }
}

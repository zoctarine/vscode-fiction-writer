import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Config } from '../config';
import { IObservable, ReservedNames } from '../utils';
import { CompileFileCommand } from './compileFileCommand';

export class CompileAllCommand extends CompileFileCommand {

  constructor(config: IObservable<Config>) {
    super(config);
  }

  getFiles(dirPath: string, recursive: boolean) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    const files = entries
      .filter(file => !file.isDirectory() && file.name.endsWith('.md') && !ReservedNames.includes(file.name))
      .map(file => ({ ...file, name: file.name, dir: dirPath }));

    if (recursive) {
      const folders = entries.filter(folder => folder.isDirectory() && !ReservedNames.includes(folder.name));

      for (const folder of folders) {
        files.push(...this.getFiles(path.join(dirPath, folder.name), true));
      }
    }

    return files;
  }

  protected async convertAndOpen(editor: vscode.TextEditor, inputs: Array<string>, format?: string) {
    try {
      const doc = editor.document;
      const docPath = path.parse(path.resolve(doc.fileName));
      let files = this.getFiles(docPath.dir, true);

      const quickPick = vscode.window.createQuickPick();
      (quickPick as any).sortByLabel = false;
      quickPick.items = files.map(f => ({ label: path.relative(docPath.dir, path.join(f.dir, f.name)) }));
      quickPick.title = 'Select files to be included in output.';
      quickPick.canSelectMany = true;
      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();

      quickPick.buttons = [{
        iconPath: new vscode.ThemeIcon('save-as'),
        tooltip: 'Generate TOC.md in current folder.'
      }];

      quickPick.onDidTriggerButton(b => {
        if (b === quickPick.buttons[0]) {
          try {
            const toc = this.makeToc(quickPick.selectedItems.map(s => s.label), []);
              quickPick.hide();
              vscode.workspace.openTextDocument({ language: 'markdown', content: toc.text })
                .then(document => {
                  vscode.window.showTextDocument(document);
                  vscode.window.showInformationMessage(`TOC file generated. Save this file in current directory.`);
                });
          } catch (error) {
            vscode.window.showErrorMessage(`Cannot generate TOC file. ${error}`);
          }
        }
      });

      quickPick.onDidAccept(async () => {
        let selected = quickPick.selectedItems.map(s => path.join(docPath.dir, s.label));
        try {
          if (selected && selected.length > 0) {
           await super.convertAndOpen(editor, selected, 'export_all', format);
          }
        } catch (error) {
          vscode.window.showErrorMessage("Error exporting file. " + error);
          this.item.hide();
        } finally {
          quickPick.hide();
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage("Error reading directory. " + error);
      this.item.hide();
    }
  }

  protected makeToc(inputs: Array<string>, errors: Array<string>)
    : { includePath: string, text: string, success: boolean } {
    try {
      return {
        text: inputs.map(i => `{${i}}`).join('\n\n'),
        includePath: path.parse(inputs[0]).root,
        success: true
      };
    } catch {
      errors.push(`Cannot read: ${inputs.join(', ')}`);
      return { text: '', includePath: '', success: false };
    }
  }
}

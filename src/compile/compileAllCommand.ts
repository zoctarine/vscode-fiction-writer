import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { QuickPickItem } from 'vscode';
import { FileIndexer } from '.';
import { Config } from '../config';
import { IObservable, ReservedNames } from '../utils';
import { CompileFileCommand } from './compileFileCommand';

export class CompileAllCommand extends CompileFileCommand {
  constructor(config: IObservable<Config>, fileIndex: FileIndexer) {
    super(config, fileIndex);
  }

  protected async convertAndOpen(
    editor: vscode.TextEditor,
    inputs: Array<string>,
    format?: string
  ) {
    try {
      const doc = editor.document;
      const docPath = path.parse(path.resolve(doc.fileName));
      let files = this.fileIndex
        .getState()
        .filter(m => m.path !== undefined)
        .map(m => m.path);

      const quickPick = vscode.window.createQuickPick();
      (quickPick as any).sortByLabel = false;
      const items: QuickPickItem[] = [];
      files.forEach(f => {
        if (f) items.push({ label: path.relative(docPath.dir, f) });
      });
      quickPick.items = items;
      quickPick.title = 'Select files to be included in output.';
      quickPick.canSelectMany = true;
      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();

      quickPick.buttons = [
        {
          iconPath: new vscode.ThemeIcon('save-as'),
          tooltip: 'Generate TOC.md in current folder.',
        },
      ];

      quickPick.onDidTriggerButton(b => {
        if (b === quickPick.buttons[0]) {
          try {
            const toc = this.makeToc(
              quickPick.selectedItems.map(s => s.label),
              []
            );
            quickPick.hide();
            vscode.workspace
              .openTextDocument({ language: 'markdown', content: toc.text })
              .then(document => {
                vscode.window.showTextDocument(document);
                vscode.window.showInformationMessage(
                  `TOC file generated. Save this file in current directory.`
                );
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
          vscode.window.showErrorMessage('Error exporting file. ' + error);
          this.item.hide();
        } finally {
          quickPick.hide();
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage('Error reading directory. ' + error);
      this.item.hide();
    }
  }

  protected makeToc(
    inputs: Array<string>,
    errors: Array<string>
  ): { includePath: string; text: string; success: boolean } {
    try {
      return {
        text: inputs.map(i => `{${i}}`).join('\n\n'),
        includePath: path.parse(inputs[0]).root,
        success: true,
      };
    } catch {
      errors.push(`Cannot read: ${inputs.join(', ')}`);
      return { text: '', includePath: '', success: false };
    }
  }
}

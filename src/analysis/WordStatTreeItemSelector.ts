import * as vscode from 'vscode';
import { WordStatTreeItem } from './WordStatTreeItem';

class TextSelector {
  private lastSearch: string = '';
  private lastIndex = 0;

  next(selection: WordStatTreeItem[]) {
    try {
      this.find(selection, (text, search) => {
        let index = text.indexOf(search, this.lastIndex + 1);
        if (index == -1) {
          return text.indexOf(search);
        }
        return index;
      });
    } catch (error) {
      // debug write error
    }
  }

  prev(selection: WordStatTreeItem[]) {
    try {
      this.find(selection, (text, search) => {
        let index = text.lastIndexOf(search, this.lastIndex - 1);
        if (index == -1) {
          return text.lastIndexOf(search);
        }
        return index;
      })
    } catch (error) {
      // debug write error
    }
  }

  private find(selection: WordStatTreeItem[], findAction: (text: string, search: string) => number) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    if (!selection || selection.length == 0) return;

    const search = selection[0].label;
    const text = editor.document.getText();

    if (search != this.lastSearch) {
      this.lastIndex = 0;
    }

    const index = findAction(text.toLocaleLowerCase(), search.toLocaleLowerCase());

    this.selectText(editor, index, search.length);
    this.lastIndex = index;
    this.lastSearch = search;
  }


  private selectText(editor: vscode.TextEditor, startIndex: number, length: number) {
    if (startIndex < 0) return;

    let pos = editor.document.positionAt(startIndex);
    let range = new vscode.Range(pos, pos?.translate(0, length));
    editor.selection = new vscode.Selection(range.start, range.end);
   vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
    editor.revealRange(range);
  }
}

export const WordStatTreeItemSelector = new TextSelector();


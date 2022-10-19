import * as vscode from 'vscode';
import { getActiveEditor, SupportedContent } from '../utils';
import { WordStatTreeItem } from './wordStatTreeItem';

class TextSelector {
  private _lastSearch: string = '';
  private _lastIndex = 0;

  next(selection: WordStatTreeItem[]) {
    try {
      this._find(selection, (text, search) => {
        let index = text.indexOf(search, this._lastIndex + 1);
        if (index === -1) {
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
      this._find(selection, (text, search) => {
        let index = text.lastIndexOf(search, this._lastIndex - 1);
        if (index === -1) {
          return text.lastIndexOf(search);
        }
        return index;
      });
    } catch (error) {
      // debug write error
    }
  }

  private _find(
    selection: WordStatTreeItem[],
    findAction: (text: string, search: string) => number
  ) {
    const editor = getActiveEditor(SupportedContent.Fiction);
    if (!editor) return;
    if (!selection || selection.length === 0) return;

    const search = selection[0].label;
    const text = editor.document.getText();

    if (search !== this._lastSearch) {
      this._lastIndex = 0;
    }

    const index = findAction(text.toLocaleLowerCase(), search.toLocaleLowerCase());

    this.selectText(editor, index, search.length);
    this._lastIndex = index;
    this._lastSearch = search;
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

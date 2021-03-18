import * as vscode from 'vscode';
import { getActiveEditor, RegEx, SupportedContent } from '../utils';
import { WordStatTreeItem } from './wordStatTreeItem';

const count = (text:string, pattern:RegExp) => {
  return ((text || '').match(pattern) || []).length;
};

export class DocStatisticTreeDataProvider implements vscode.TreeDataProvider<WordStatTreeItem> {
  private document: vscode.TextDocument | undefined;
  constructor() { }

  getTreeItem(element: WordStatTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: WordStatTreeItem): Thenable<WordStatTreeItem[]> {
    if (!this.document) {
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve([]);
    } else {
      const text =  this.document.getText();
      const wordCount = count(text, RegEx.WHOLE_WORD);
      const charCount = count(text, RegEx.ANY_CHARACTER_ESCEPT_NEWLINE);
      const charCountNoSpaces = count(text, RegEx.ANY_CHARACTER_EXCEPT_WHITESPACE);
      const estWordCount = Math.ceil(charCount / 6);
      const estLines = Math.ceil(estWordCount / 10);
      const estPages = Math.ceil(estLines / 24);
      const estReadTime = wordCount / 200;
      const estReadTimeMin = Math.floor(estReadTime);
      const estReadTimeSec = Math.round(60 * (estReadTime - estReadTimeMin));

      const asString = (n:number) => `${n}`;
      return Promise.resolve([
        new WordStatTreeItem(asString(wordCount), 'Words', 1, 'Word Count', new vscode.ThemeIcon('whole-word')),
        new WordStatTreeItem(asString(charCountNoSpaces), 'Characters (exluding spaces)', 3, 'Character excluding spaces', new vscode.ThemeIcon('symbol-key')),
        new WordStatTreeItem(asString(charCount), 'Characters (including spaces)',  2, 'Characters including spaces', new vscode.ThemeIcon('whitespace')),
        new WordStatTreeItem(asString(estPages),'Est. Pages', 4, 'At 24 lines per page', new vscode.ThemeIcon('files')),
        new WordStatTreeItem(asString(estLines),'Est. Lines', 4, 'At 10 words per line', new vscode.ThemeIcon('word-wrap')),
        new WordStatTreeItem(asString(estWordCount),'Est. Word Count', 4, 'At 6 characters per word', new vscode.ThemeIcon('zap')),
        new WordStatTreeItem(`${estReadTimeMin} min, ${estReadTimeSec} sec`,'Est. Reading Time', 4, 'At 200 wpm', new vscode.ThemeIcon('eye')),
      ]);
    }
  }

  private _onDidChangeTreeData: vscode.EventEmitter<WordStatTreeItem | undefined | null | void> = new vscode.EventEmitter<WordStatTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<WordStatTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this.document = getActiveEditor(SupportedContent.Fiction)?.document;
    this._onDidChangeTreeData.fire();
  }

  clear(): void {
    this.document = undefined;
    this._onDidChangeTreeData.fire();
  }
}

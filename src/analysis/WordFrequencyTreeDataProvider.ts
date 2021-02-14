import * as vscode from 'vscode';
import { Constants, RegEx } from '../utils';
import { WordStatTreeItem } from './WordStatTreeItem';


export class WordFrequencyTreeDataProvider implements vscode.TreeDataProvider<WordStatTreeItem> {
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
      return Promise.resolve(
        this.getFrequencies(this.document.getText(), element.count)
      );
    } else {
      return Promise.resolve([
        new WordStatTreeItem("1 Word", '', 1, 'Word frequency', vscode.ThemeIcon.Folder, vscode.TreeItemCollapsibleState.Collapsed),
        new WordStatTreeItem("2 Words", '', 2, 'Two word phrases', vscode.ThemeIcon.Folder, vscode.TreeItemCollapsibleState.Collapsed),
        new WordStatTreeItem("3 Words", '', 3, 'Three word phrases', vscode.ThemeIcon.Folder, vscode.TreeItemCollapsibleState.Collapsed),
        new WordStatTreeItem("4 Words", '', 4, 'Four word phrases', vscode.ThemeIcon.Folder, vscode.TreeItemCollapsibleState.Collapsed),
        new WordStatTreeItem("5 Words", '', 5, 'Five word phrases', vscode.ThemeIcon.Folder, vscode.TreeItemCollapsibleState.Collapsed),
      ]);
    }
  }

  private getWords(text: string): string[] {
    const result: string[] = [];
    [...text.matchAll(RegEx.WORDS_AND_SEPARATORS)]
      .forEach(matches => result.push(...matches.slice(1).filter(s => s !== '')));

    return result;
  }

  private countWords(text: string, windowSize: number): Map<string, number> {
    const freq = new Map<string, number>();
    const words = this.getWords(text);

    const addWord = (word: string) => {
      word = word.toLowerCase();
      let e = freq.get(word);
      freq.set(word, e ? 1 + e : 1);
    };

    for (let i = 0; i < words.length - windowSize; i++) {
      let word = words.slice(i, i + windowSize).join(' ');

      if (word.match(RegEx.WORD_OR_MULTIWORD))
        addWord(word);
    }

    return new Map([...freq.entries()].sort((a, b) => b[1] - a[1]));
  }


  private getFrequencies(text: string, count: number): WordStatTreeItem[] {
    const result: WordStatTreeItem[] = [];
    const icon = vscode.ThemeIcon.File;

    const wf = this.countWords(text, count).forEach((value: number, key: string) => {
      result.push(new WordStatTreeItem(
        key,
        `${value}`,
        value,
        `"${key}" repeats ${value} time${value > 1 ? 's' : ''}`,
        icon,
        vscode.TreeItemCollapsibleState.None,
        Constants.Commands.WORDFREQ_FIND_NEXT));
    });


    return result;
  }

  private _onDidChangeTreeData: vscode.EventEmitter<WordStatTreeItem | undefined | null | void> = new vscode.EventEmitter<WordStatTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<WordStatTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this.document = vscode.window.activeTextEditor?.document;
    this._onDidChangeTreeData.fire();
  }

  clear(): void {
    this.document = undefined;
    this._onDidChangeTreeData.fire();
  }
}

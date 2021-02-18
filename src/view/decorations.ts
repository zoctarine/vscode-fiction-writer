import { DecorationRangeBehavior, Range, TextDocument, TextEditor, TextEditorDecorationType, window, workspace } from 'vscode';
import * as vscode from 'vscode';
import { IObservable, Observer } from '../observable';
import { Config } from '../config';
import { isSupported } from '../utils';

const decorationTypes = {
  boldSemiTransparent: window.createTextEditorDecorationType({
    'fontWeight': 'bold',
    'opacity': '0.6',
    'rangeBehavior': DecorationRangeBehavior.ClosedClosed
  }),

  comment: window.createTextEditorDecorationType({
    'dark': { 'color': '#FF0000' },
    'light': { 'color': '000000' },
    'rangeBehavior': DecorationRangeBehavior.ClosedClosed
  })
};

const decorations = new Map<string, { decoration: TextEditorDecorationType | TextEditorDecorationType[], pattern: RegExp, trigger?: string[] }>([
  ['dialogueMarker', {
    pattern: /(")([\s\S]*?)(")/igu,
    trigger: ['"'],
    decoration: decorationTypes.comment
  }],
  ['fileTag', {
    pattern: /(^\/\/\s+)(draft|rev1|rev2)/igu,
    decoration: [
      decorationTypes.boldSemiTransparent,
      decorationTypes.boldSemiTransparent,
    ]
  }]
]);

export class TextDecorations extends Observer<Config> {
  activeDecorations: Map<TextEditorDecorationType, Range[]> = new Map<TextEditorDecorationType, Range[]>();
  timeout: NodeJS.Timeout | null = null;
  trigger: RegExp;

  constructor(observable: IObservable<Config>){
    super(observable);

    let contentTriggers: string[] = [];
    decorations.forEach(val => {
      if (val.trigger) contentTriggers.push(...val.trigger);
    });
    this.trigger = new RegExp(`[${contentTriggers.join()}]`, 'giu');
    this.updateDecorations(window.activeTextEditor);
    this.addDisposable(window.onDidChangeActiveTextEditor(e => this.updateDecorations(e)));
    this.addDisposable(workspace.onDidChangeTextDocument(e => this.textDocumentChanged(e)));
  }

  clearDecorations() {
    this.activeDecorations.forEach((val, key, map) => map.set(key, []));
  }

  getDocRange(start: number, length: number, doc: TextDocument): Range {
    return new Range(doc.positionAt(start), doc.positionAt(start + length));
  }

  addDecoration(key: TextEditorDecorationType, range: Range) {
    var dec = this.activeDecorations.get(key) || [];
    dec.push(range);
    this.activeDecorations.set(key, dec);
  }

  textDocumentChanged(event: vscode.TextDocumentChangeEvent)
   {
    let editor = window.activeTextEditor;
    if (editor !== undefined && event.document === editor.document) {
      if (event.contentChanges.length > 0 &&
        event.contentChanges[0].text &&
        event.contentChanges[0].text.match(this.trigger)) {
        this.triggerUpdateDecorations(editor, 10);
      }
      else
        this.triggerUpdateDecorations(editor);
    }
  }

  updateDecorations(editor?: TextEditor) {
    if (!isSupported(editor) || !editor?.document) { return; }

    const document = editor.document;

    this.clearDecorations();
    const text = document.getText();
    if (text.length === 0) return;

    decorations.forEach((dec) => {
      let match;
      while ((match = dec.pattern.exec(text)) !== null) {
        if (!Array.isArray(dec.decoration))
          this.addDecoration(dec.decoration, this.getDocRange(match.index, match[0].length, document));
        else {
          let buffer = '';
          for (let i = 1; i < match.length; i++) {

            if (i <= dec.decoration.length) {
              this.addDecoration(dec.decoration[i - 1], this.getDocRange(
                match.index + buffer.length,
                match[i].length, document));
            }
            buffer += match[i];
          }
        }
      };
    });
    this.activeDecorations.forEach((value, key) => {
      editor.setDecorations(key, value);
    });
  }

  triggerUpdateDecorations(editor: TextEditor, ms: number = 500) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => this.updateDecorations(editor), ms);
  }
}



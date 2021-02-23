import { DecorationRangeBehavior, Range, TextDocument, TextEditor, TextEditorDecorationType, window, workspace } from 'vscode';
import * as vscode from 'vscode';
import { IObservable, Observer } from '../utils';
import { Config } from '../config';

const decorationTypes = {
  boldSemiTransparent: window.createTextEditorDecorationType({
    'fontWeight': 'bold',
    'opacity': '0.6',
    'rangeBehavior': DecorationRangeBehavior.ClosedClosed
  }),

  tag: window.createTextEditorDecorationType({
    'fontWeight': 'bold',
    'borderRadius': '5px',
    'borderSpacing': '5px',
    'backgroundColor': new vscode.ThemeColor('editorWhitespace.foreground'),
    'rangeBehavior': DecorationRangeBehavior.ClosedClosed,
  }),
  comment: window.createTextEditorDecorationType({
    'color': new vscode.ThemeColor('textLink.foreground'),
    'rangeBehavior': DecorationRangeBehavior.ClosedClosed
  }),
  semiTransparent: window.createTextEditorDecorationType({
    'opacity': '0.5',
    'rangeBehavior': DecorationRangeBehavior.ClosedClosed
  }),
};

export class TextDecorations extends Observer<Config>{
  activeDecorations: Map<TextEditorDecorationType, Range[]> = new Map<TextEditorDecorationType, Range[]>();
  timeout: NodeJS.Timeout | null = null;
  trigger: RegExp;

  decorations = new Map<string, {
    decoration: TextEditorDecorationType | (TextEditorDecorationType | undefined)[],
    pattern: RegExp,
    trigger?: string[],
    isEnabled: (config: Config) => boolean
  }
  >([
    ['dialogueLine', {
      pattern: /^(--{1,2}|—)(?=\s{0,1}[\p{L}]+)|(")/iugm,
      trigger: ['-'],
      decoration: decorationTypes.semiTransparent,
      isEnabled: c => c.viewDialogueHighlightMarkers === true
    }],
    ['dialogue', {
      pattern: /(")([\s\S]*?)(")/igu,
      trigger: ['"'],
      decoration: [
        undefined,
        decorationTypes.comment,
        undefined,
      ],
      isEnabled: c => c.viewDialogueHighlight === true
    }],
    ['fileTag', {
      pattern: /(^\/\/\s+)(draft|rev1|rev2)/igu,
      decoration: [
        undefined,
        decorationTypes.tag,
      ],
      isEnabled: c => c.metaFileBadgesEnabled === true
    }],
    ['meta', {
      pattern: /(^---)(.*?)(---|\.\.\.)/sgu,
      decoration: [
        decorationTypes.semiTransparent,
        decorationTypes.semiTransparent,
        decorationTypes.semiTransparent,
      ],
      isEnabled: c=> true
    }]
  ]);

  constructor(observasble: IObservable<Config>) {
    super(observasble);

    this.loadTags();
    this.trigger = this.loadTrigger();

    this.updateDecorations(window.activeTextEditor);
    this.addDisposable(window.onDidChangeActiveTextEditor(e => this.updateDecorations(e)));
    this.addDisposable(workspace.onDidChangeTextDocument(e => this.textDocumentChanged(e)));
  }

  loadTrigger(): RegExp {
    let contentTriggers: string[] = [];
    this.decorations.forEach(val => {
      if (val.trigger) contentTriggers.push(...val.trigger);
    });
    return new RegExp(`[${contentTriggers.join()}]`, 'giu');
  }

  loadTags() {
    const fileTag = this.decorations.get('fileTag');
    if (!fileTag) return;


    const knownTags = Object.getOwnPropertyNames(this.state.viewFileTags);
    if (!knownTags || knownTags.length === 0) return;
    knownTags.push(...knownTags.map(t => this.state.viewFileTags![t]?.substr(0, 2)).filter(t => t?.length > 0));
    if (!knownTags || knownTags.length === 0) return;

    fileTag.pattern = new RegExp(`(^\\/\\/\\s+)(${knownTags.join('|')})\\b`, 'gu');

    this.decorations.set('fileTag', fileTag);
  }

  clearDecorations() {
    this.activeDecorations.forEach((val, key, map) => map.set(key, []));
  }

  isValid(editor?: TextEditor) {
    return editor && editor.document && editor.document.languageId === 'markdown';
  }

  getDocRange(start: number, length: number, doc: TextDocument): Range {
    return new Range(doc.positionAt(start), doc.positionAt(start + length));
  }

  addDecoration(decoration: TextEditorDecorationType | undefined, range: Range) {
    if (!decoration) return;
    var dec = this.activeDecorations.get(decoration) || [];
    dec.push(range);
    this.activeDecorations.set(decoration, dec);
  }

  textDocumentChanged(event: vscode.TextDocumentChangeEvent) {
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
    if (editor === undefined || !this.isValid(editor) || !editor.document || editor.document.languageId !== 'markdown') { return; }
    const document = editor.document;

    this.clearDecorations();
    const text = document.getText();
    if (text.length === 0) return;

    this.decorations.forEach((dec) => {
      if (!dec.isEnabled(this.state)) return;
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


  protected onStateChange(newState: Config) {
    if (this.state.viewDialogueHighlight !== newState.viewDialogueHighlight ||
        this.state.viewDialogueHighlightMarkers !== newState.viewDialogueHighlightMarkers ||
        this.state.metaFileBadgesEnabled !== newState.metaFileBadgesEnabled ){
          this.loadTags();
          vscode.window.visibleTextEditors.forEach(e => this.triggerUpdateDecorations(e, 10));
        }

    super.onStateChange(newState);
  }
}
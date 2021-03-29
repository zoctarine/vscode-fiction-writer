import { DecorationRangeBehavior, Range, TextDocument, TextEditor, TextEditorDecorationType, window, workspace } from 'vscode';
import * as vscode from 'vscode';
import { IObservable, Observer } from '../utils';
import { Config } from '../config';
import { defaultMaxListeners } from 'events';

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
    'rangeBehavior': DecorationRangeBehavior.ClosedClosed,

  }),

  opaque: window.createTextEditorDecorationType({
    'opacity': '1',
    'rangeBehavior': DecorationRangeBehavior.OpenOpen
  }),
};

export class TextDecorations extends Observer<Config>{
  activeDecorations: Map<TextEditorDecorationType, Range[]> = new Map<TextEditorDecorationType, Range[]>();
  timeout: NodeJS.Timeout | null = null;
  trigger: RegExp;
  private _lastSelection?: vscode.Position;

  decorations = new Map<string, {
    decoration: TextEditorDecorationType | (TextEditorDecorationType | undefined)[],
    pattern: RegExp,
    trigger?: string[],
    isEnabled: (config: Config) => boolean,
    skipIfContainsSelection?:boolean
  }
  >([
    ['dialogueLine', {
      pattern: /^(--{1,2}|—)(?=[ ]{0,1}[\p{L}]+)|(")/iugm,
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
      isEnabled: c => c.metaKeywordsShowBadges === true
    }],
    ['meta', {
      pattern: /(^---)(.*?)(---|\.\.\.)/sgu,
      decoration: [
        decorationTypes.semiTransparent,
        decorationTypes.semiTransparent,
        decorationTypes.semiTransparent,
      ],
      isEnabled: c=> c.viewFadeMetadata === true,
      skipIfContainsSelection: true
    }]
  ]);

  // needs to be dynamic based on configuration
  private _focusModeOpacityDecoration: vscode.TextEditorDecorationType | undefined;

  constructor(observasble: IObservable<Config>) {
    super(observasble);

    this.loadTags();
    this.trigger = this.loadTrigger();

    this.updateDecorations(window.activeTextEditor);
    this.addDisposable(window.onDidChangeActiveTextEditor(e => { this._lastSelection = undefined; this.updateDecorations(e);} ));
    this.addDisposable(workspace.onDidChangeTextDocument(e => this.textDocumentChanged(e)));
    this.addDisposable(window.onDidChangeTextEditorSelection(e => this.textSelectionChanged(e)));
  }
  
  textSelectionChanged(e: vscode.TextEditorSelectionChangeEvent): any {
    const newSelection = e.textEditor.selection.active;
    if (this._lastSelection?.line !== newSelection?.line) {
      this.triggerUpdateDecorations(e.textEditor, 0);
      this._lastSelection = newSelection;
    }
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

    if (this.state.isFocusMode){
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      
      const selLine = document.lineAt(editor.selection.active.line);

      if (this._focusModeOpacityDecoration){
        this.addDecoration(this._focusModeOpacityDecoration, new vscode.Range(firstLine.range.start, selLine.range.start));
        this.addDecoration(this._focusModeOpacityDecoration, new vscode.Range(selLine.range.end, lastLine.range.end));
      }
    }

    const text = document.getText();
    if (text.length === 0) return;

    this.decorations.forEach((dec) => {
      if (!dec.isEnabled(this.state)) return;
      let match;

      while ((match = dec.pattern.exec(text)) !== null) {
        
        if (dec.skipIfContainsSelection){
          const pos = this.getDocRange(match.index, match[0].length, document);
          if (pos.contains(editor.selection?.active)) continue;
        }

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
    this._focusModeOpacityDecoration = vscode.window.createTextEditorDecorationType({
      opacity: newState.viewFocusModeOpacity.toString()
    });

    if (this.state.viewDialogueHighlight !== newState.viewDialogueHighlight ||
        this.state.viewDialogueHighlightMarkers !== newState.viewDialogueHighlightMarkers ||
        this.state.metaKeywordsShowBadges !== newState.metaKeywordsShowBadges ||
        this.state.isFocusMode !== newState.isFocusMode ||
        this.state.viewFadeMetadata !== newState.viewFadeMetadata ){
          this.loadTags();
          vscode.window.visibleTextEditors.forEach(e => this.triggerUpdateDecorations(e, 10));
        }

    super.onStateChange(newState);
  }
}
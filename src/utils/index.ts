import { TextDocument, TextEditor, window, Uri } from 'vscode';

export * from './constants';
export * from './disposables';
export * as StringUtils from './strings';
export * from './observables';
export * from './inMemoryCache';
export * from './logger';

export enum SupportedContent {
  Unknown  = 0,  	   // 000 -- the bitshift is unnecessary
  Fiction  = 1 << 0, // 001
  Metadata = 1 << 1, // 010
  Notes    = 1 << 2, // 100
}

export class ContentType {

  constructor(public supports: SupportedContent = SupportedContent.Unknown) {
  }

  isKnown(): boolean {
    return this.supports !== SupportedContent.Unknown;
  }

  has(content: SupportedContent): boolean {
    if (content === SupportedContent.Unknown) {
      return this.supports === content;
    }

    return (this.supports & content) === content;
  }

  add(content: SupportedContent) {
    this.supports |= content;
  }

  clear() {
    this.supports = SupportedContent.Unknown;
  }
}


/**
 * Checks that the editor is valid editor for this extension
 * @param editor Usually the active text editor
 */
export function getContentType(document?: TextDocument): ContentType {
  const result = new ContentType();
  if (document === undefined || document === null) return result;
  
  // Skip backup files, no matter what language they have
  const name = document.fileName.toLowerCase();
  if (name.endsWith('.tmp')) return result;

  if (name.endsWith('.txt')) {
    result.add(SupportedContent.Notes);
  }

  if (document.languageId === 'yaml') {
    result.add(SupportedContent.Metadata);
  }

  if (document.languageId === 'markdown') {
    result.add(SupportedContent.Fiction);
    result.add(SupportedContent.Metadata);
  }

  return result;
}

export function isInActiveEditor(uri: Uri | undefined, supportedContent: SupportedContent): boolean {
  if (!uri) return false;

  const editor = getActiveEditor(supportedContent);
  if (!editor?.document) return false;

  return uri && editor.document.uri.fsPath === uri.fsPath;
}

/**
 * Returns the active text editor. If the editor is not valid, or supported, it returns undefined.
 */
export function getActiveEditor(supportedContent: SupportedContent): TextEditor | undefined {
  const editor = window.activeTextEditor;

  return getContentType(editor?.document).has(supportedContent)
    ? editor
    : undefined;
}
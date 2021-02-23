import { TextDocument, TextEditor, window, workspace, Uri, FileType } from 'vscode';

export * from './constants';
export * from './disposables';
export * as StringUtils from './strings';
export * from './observables';
/**
 * Checks that the editor is valid editor for this extension
 * @param editor Usually the active text editor
 */
export function isSupported(editor?: TextEditor) {
	return isSupportedDoc(editor?.document);
}

export function isSupportedDoc(document?: TextDocument){
	return document !== undefined && document !== null && document.languageId === 'markdown';
}

export function isInActiveEditor(uri: Uri | undefined): boolean {
  if (!uri) return false;

  const editor = getActiveEditor();
  if (!editor?.document) return false;

  return uri && editor.document.uri.fsPath === uri.fsPath;
}

export function isSupportedPathAsync(uri: Uri | undefined): boolean {
  if (!uri) return false;

  return uri.fsPath.endsWith('.md');
}

/**
 * Returns the active text editor. If the editor is not valid, or supported, it returns undefined.
 */
export function getActiveEditor(): TextEditor | undefined {
	const editor = window.activeTextEditor;

	return isSupported(editor)
		? editor
		: undefined;
}
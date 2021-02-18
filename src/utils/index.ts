import { TextEditor, window } from 'vscode';

export * from './constants';
export * from './disposables';
export * as StringUtils from './strings';

/**
 * Checks that the editor is valid editor for this extension
 * @param editor Usually the active text editor
 */
export function isSupported(editor?: TextEditor) {
	return editor !== undefined && editor !== null && editor.document && editor.document.languageId === 'markdown';
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
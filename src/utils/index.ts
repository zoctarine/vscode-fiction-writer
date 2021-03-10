import { TextDocument, TextEditor, window, workspace, Uri, FileType } from 'vscode';

export * from './constants';
export * from './disposables';
export * as StringUtils from './strings';
export * from './observables';
export * from './inMemoryCache';

export enum ContentType {
	Unknown = 0,
	Fiction = 1,
	Metadata = 2,
  }

/**
 * Checks that the editor is valid editor for this extension
 * @param editor Usually the active text editor
 */
export function isFictionDocument(document?: TextDocument){
	return document !== undefined && document !== null && document.languageId === 'markdown';
}

export function isMetadataDocument(document?: TextDocument){
	return document !== undefined && document !== null && document.languageId === 'yaml';
}

export function isInActiveFictionEditor(uri: Uri | undefined): boolean {
  if (!uri) return false;

  const editor = getActiveFictionEditor();
  if (!editor?.document) return false;

  return uri && editor.document.uri.fsPath === uri.fsPath;
}

export function isInActiveMetadataEditor(uri: Uri | undefined): boolean {
	if (!uri) return false;
	if (isInActiveFictionEditor(uri)) return true;

	const editor = getActiveMetadataEditor();
	if (!editor?.document) return false;

	return uri && editor.document.uri.fsPath === uri.fsPath;
  }


 export function getEditorContentType(editor?: TextEditor) {
	return getDocumentContentType(editor?.document);
}

export function getDocumentContentType(document?: TextDocument){
	return getUriContentType(document?.uri);
}

export function getUriContentType(uri?: Uri) : ContentType{
	return getPathContentType(uri?.fsPath);
}

export function getPathContentType(path?: string) : ContentType {
	if (!path) return ContentType.Unknown;

	if (path.toLowerCase().endsWith('.md')) return ContentType.Fiction;
	if (path.toLowerCase().endsWith('.yml')) return ContentType.Metadata;

	return ContentType.Unknown;
}

/**
 * Returns the active text editor. If the editor is not valid, or supported, it returns undefined.
 */
export function getActiveFictionEditor(): TextEditor | undefined {
	const editor = window.activeTextEditor;

	return getEditorContentType(editor) === ContentType.Fiction
		? editor
		: undefined;
}

/**
 * Returns the active text editor. If the editor is not valid, or supported, it returns undefined.
 */
 export function getActiveMetadataEditor(): TextEditor | undefined {
	const editor = window.activeTextEditor;
	const editorContent = getEditorContentType(editor);

	return editorContent === ContentType.Fiction || editorContent === ContentType.Metadata
		? editor
		: undefined;
}

export function isFictionOrMetadataUri(uri?: Uri) {
	const contentType = getUriContentType(uri);

	return contentType === ContentType.Fiction || contentType === ContentType.Metadata;
}
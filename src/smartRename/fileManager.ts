import * as vscode from 'vscode';
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';

import { ContentType } from '../utils';
import { resolveCliPathFromVSCodeExecutablePath } from 'vscode-test';

const fictionExtension = '.md';
const metadataExtension = '.yml';

export interface IFileGroup {
	path: string,
	files: Map<ContentType, string>
}

export class FileManager {

	public getGroup(fsPath: string): IFileGroup {
		const files = new Map<ContentType, string>();
		fsPath = path.normalize(fsPath);

		const contentType = this.getContentType(fsPath);
		files.set(contentType, fsPath);

		const parsed = path.parse(fsPath);
		const matches = glob.sync(path.join(parsed.dir, parsed.name, '.*'));

		for (let match of matches) {
			const matchType = this.getContentType(match);
			if ((contentType === ContentType.Fiction && matchType === ContentType.Metadata) ||
				(contentType === ContentType.Metadata && matchType === ContentType.Fiction)) {
				files.set(matchType, match);
				break;
			}
		};

		return {
			path: fsPath,
			files: files
		};
	}

	public isFictionDocument(fsPath?: string) { return fsPath?.toLowerCase().endsWith(fictionExtension) ?? false; }

	public isMetadataDocument(fsPath?: string) { return fsPath?.toLowerCase().endsWith(metadataExtension) ?? false; }

	public getContentType(fsPath: string) {
		return this.isFictionDocument(fsPath)
			? ContentType.Fiction
			: this.isMetadataDocument(fsPath)
				? ContentType.Metadata
				: ContentType.Unknown;
	}
}
import * as vscode from 'vscode';
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';

import { ContentType, SupportedContent } from '../utils';

const fictionExtension = '.md';
const metadataExtension = '.yml';
const notesExtension = '.txt';

const fictionPattern = '.[mM][dD]';
const metadataPattern = '.[yY][mM][lL]';
const notesPattern = '.[tT][xX][tT]';

const knownPatterns = new Map<SupportedContent, string>([
  [SupportedContent.Fiction, fictionPattern],
  [SupportedContent.Metadata, metadataPattern],
  [SupportedContent.Notes, notesPattern]
]);

export interface IFileGroup {
  path: string;
  content: SupportedContent;
  other: Map<SupportedContent, string>;
  getPath(forContent: SupportedContent): string | undefined;
}

class FileGroup implements IFileGroup {
  constructor(
    public path: string,
    public content: SupportedContent,
    public other: Map<SupportedContent, string>) { }

  getPath(forContent: SupportedContent): string | undefined {
    if (this.content === forContent) return this.path;

    return this.other.get(forContent);
  }

}

export class FileManager {

  public getGroup(fsPath: string): IFileGroup {

    fsPath = path.normalize(fsPath);
    const otherFiles = new Map<SupportedContent, string>();
    const contentType = this.getPathContentType(fsPath, true);

    const parsed = path.parse(fsPath);

    if (contentType.isKnown()) {
      knownPatterns.forEach((pattern, type) => {
        if (contentType.has(type)) return;
        const matches = glob.sync(path.join(parsed.dir, `${parsed.name}${pattern}`));
        if (matches.length > 0) {
          otherFiles.set(type, matches[0]); // get only first match
        }
      });
    };

    return new FileGroup(
      fsPath,
      contentType.supports,
      otherFiles
    );
  }


  public getPathContentType(path?: string, strict: boolean = false): ContentType {
    const result = new ContentType();
    if (!path) return result;

    const standardPath = path.toLowerCase();

    if (standardPath.endsWith(fictionExtension)) {
      result.add(SupportedContent.Fiction);

      if (!strict) result.add(SupportedContent.Metadata);
    }

    if (standardPath.endsWith(metadataExtension)) {
      result.add(SupportedContent.Metadata);
    }

    if (standardPath.endsWith(notesExtension)) {
      result.add(SupportedContent.Notes);
    }

    return result;
  }

  public batchRename(
    oldName: string,
    newName: string,
    question: (from: string, to: string) => Promise<boolean> = (from, to) => Promise.resolve(true)) {

    const oldContent = this.getPathContentType(oldName, true);
    const newContent = this.getPathContentType(newName, true);
    if (oldContent.supports !== newContent.supports) return;

    const fileGroup = this.getGroup(oldName);

    if (fileGroup.other.size > 0) {
      const parsed = path.parse(newName);
      const newPart = path.join(parsed.dir, parsed.name);

      fileGroup.other.forEach((oldName: string, key: SupportedContent) => {
        const oldExt = path.parse(oldName).ext;
        const newName = `${newPart}${oldExt}`;

        question(oldName, newName).then((shouldRename: boolean) => {
          if (shouldRename) fs.renameSync(oldName, newName);
        });
      });
    }
  }

  public moveUp(fsPath: string) {
    // get folder of file
    // if all files are prepared for rename, then increment
    // if not, then ask to fix and then rename
  }

  public smartRename(fsPath: string) {
    const parsed = path.parse(fsPath);
    const allFiles = glob.sync(path.join(parsed.dir, '*.[mM][dD]'), { nodir: true });
    //TODO: Implement functioinality
  }
}

export const fileManager = new FileManager();
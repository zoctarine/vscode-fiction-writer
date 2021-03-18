import * as vscode from 'vscode';
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';

import { Constants, ContentType, logger, SupportedContent } from '../utils';

export const knownFileTypes = {
  fiction: {
    extension: '.md',
    pattern: '.[mM][dD]',
  },
  metadata: {
    extension: '.yml',
    pattern: '.[yY][mM][lL]',
    optionalSubdir: Constants.WorkDir
  },
  notes: {
    extension: '.txt',
    pattern: '.[tT][xX][tT]',
    optionalSubdir: Constants.WorkDir
  },
  all: {
    pattern: '**/*.{[mM][dD],[yY][mM][lL],[tT][xX][tT]}'
  }
};

const knownPatterns: {type: SupportedContent, pattern:string, subdir: string}[] = [
  { type: SupportedContent.Fiction, pattern: knownFileTypes.fiction.pattern, subdir: ''},
  { type: SupportedContent.Metadata, pattern: knownFileTypes.metadata.pattern, subdir: ''},
  { type: SupportedContent.Metadata, pattern: knownFileTypes.metadata.pattern, subdir: knownFileTypes.metadata.optionalSubdir},
  { type: SupportedContent.Notes, pattern: knownFileTypes.notes.pattern, subdir: ''},
  { type: SupportedContent.Notes, pattern: knownFileTypes.notes.pattern, subdir: knownFileTypes.notes.optionalSubdir},
];

export interface IFileGroup {
  path: string;
  content: SupportedContent;
  other: Map<SupportedContent, string>;
  getPath(forContent: SupportedContent): string | undefined;
  getAll(): string[];
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

  getAll(): string[] {
    const result: string[] = [];

    result.push(this.path);
    this.other.forEach((path) => result.push(path));

    return result;
  }

}

export class FileManager {

  moveToFolder(fsPath?: string) {
    if (!fsPath) return;
    if (!this.getPathContentType(fsPath).isKnown()) return;

    {
      try {
        const oldFile = fsPath;
        const parsed = path.parse(oldFile);
        const dirPath = path.join(parsed.dir, Constants.WorkDir);
        const newFile = path.join(dirPath, parsed.base);

        if (!fs.existsSync(dirPath)){
          fs.mkdirSync(dirPath);
        }
        fs.renameSync(oldFile, newFile);
      } catch (error) {
        vscode.window.showErrorMessage(`Could not move '${fsPath}' to resources folder.`);
      }
    };

  }

  public normalize(fsPath: string): string {
    return  path.normalize(fsPath).replace(/\\/g, '/');
  }

  public getRoot(fsPath: string) : string {
    fsPath = path.normalize(fsPath);
    const contentType = this.getPathContentType(fsPath, true);
    const parsed = path.parse(fsPath);
    let dir = parsed.dir;
    if (!contentType.has(SupportedContent.Fiction)){
      // if is not main document, then try to get main document
      const p = path.parse(dir);
      if (p.base === Constants.WorkDir){
        dir = p.dir;
      }
    }
    return this.normalize(path.join(dir, parsed.name));
  }

  public getGroup(fsPath: string): IFileGroup {

    fsPath = this.normalize(fsPath);
    const otherFiles = new Map<SupportedContent, string>();
    const contentType = this.getPathContentType(fsPath, true);
    const parsed = path.parse(fsPath);
    let dir = parsed.dir;
    if (!contentType.has(SupportedContent.Fiction)){
      // if is not main document, then try to get main document
      const p = path.parse(dir);
      if (p.base === Constants.WorkDir){
        dir = p.dir;
      }
    }

    if (contentType.isKnown()) {
      knownPatterns.forEach((search) => {

        if (contentType.has(search.type)) return;
        if (otherFiles.has(search.type)) return;

        const matches = glob.sync(path.join(dir, search.subdir, `${parsed.name}${search.pattern}`));
        if (matches.length > 0) {
          otherFiles.set(search.type, matches[0]); // get only first match
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

    if (standardPath.endsWith(knownFileTypes.fiction.extension)) {
      result.add(SupportedContent.Fiction);

      if (!strict) result.add(SupportedContent.Metadata);
    }

    if (standardPath.endsWith(knownFileTypes.metadata.extension)) {
      result.add(SupportedContent.Metadata);
    }

    if (standardPath.endsWith(knownFileTypes.notes.extension)) {
      result.add(SupportedContent.Notes);
    }

    return result;
  }

  public areInSameLocation(path1: string, path2: string): boolean {
    return path.parse(path1).dir === path.parse(path2).dir;
  }

  public async batchRename(
    oldName: string,
    newName: string,
    question: (from: string, to: string) => Promise<boolean> = (from, to) => Promise.resolve(true)) {

    const oldContent = this.getPathContentType(oldName, true);
    const newContent = this.getPathContentType(newName, true);
    if (oldContent.supports !== newContent.supports) return;

    const fileGroup = this.getGroup(oldName);

    if (fileGroup.other.size > 0) {
      const parsed = path.parse(newName);
      const newPart = path.join(parsed.dir, Constants.WorkDir, parsed.name);

      for (const oldName of fileGroup.other.values()) {
        const oldExt = path.parse(oldName).ext;

        const newName = `${newPart}${oldExt}`;

        const shouldRename = await question(oldName, newName);
        if (shouldRename) fs.renameSync(oldName, newName);
        logger.info('renamed: ' + oldName);
      };
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
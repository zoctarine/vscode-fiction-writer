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
    extension: '.md.yml',
    pattern: '.[mM][dD].[yY][mM][lL]',
    optionalSubdir: Constants.WorkDir
  },
  notes: {
    extension: '.md.txt',
    pattern: '.[mM][dD].[tT][xX][tT]',
    optionalSubdir: Constants.WorkDir
  },
  all: {
    pattern: '**/*.{[mM][dD],[mM][dD].[yY][mM][lL],[mM][dD].[tT][xX][tT]}'
  }
};

const knownPatterns: {type: SupportedContent, pattern:string, subdir: string}[] = [
  { type: SupportedContent.Fiction, pattern: knownFileTypes.fiction.pattern, subdir: ''},
  { type: SupportedContent.Metadata, pattern: knownFileTypes.metadata.pattern, subdir: ''},
  { type: SupportedContent.Notes, pattern: knownFileTypes.notes.pattern, subdir: ''},
  // TODO: Support .fic subdirectory: 
  //{ type: SupportedContent.Metadata, pattern: knownFileTypes.metadata.pattern, subdir: knownFileTypes.metadata.optionalSubdir},
  //{ type: SupportedContent.Notes, pattern: knownFileTypes.notes.pattern, subdir: knownFileTypes.notes.optionalSubdir},
];

export interface IFileGroup {
  files: Map<SupportedContent, string>;
  getPath(forContent: SupportedContent): string | undefined;
  getAll(): string[];
}



class FileGroup implements IFileGroup {
  public files: Map<SupportedContent, string>

  constructor(files?: Map<SupportedContent, string>) { 
    if (!files)
      this.files = new Map<SupportedContent, string>();
    else
      this.files = files;
  }

  getPath(forContent: SupportedContent): string | undefined {
    return this.files.get(forContent);
  }

  getAll(): string[] {
    const result: string[] = [];
    this.files.forEach((path) => result.push(path));
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

  public getRoot(fsPath: string) : string | undefined {
    if (!path) return undefined;

    fsPath = path.normalize(fsPath);
    const contentType = this.getPathContentType(fsPath);
    if (!contentType.isKnown()) return undefined;

    // get main .md path
    return fsPath.replace(/(\.yml|\.txt)*$/gi, '')
  }


  public getGroup(fsPath: string): IFileGroup {

    fsPath = this.normalize(fsPath);
    const contentType = this.getPathContentType(fsPath, true);
    if (!contentType.isKnown()) return new FileGroup();
    const rootPath = this.getRoot(fsPath);
    if (!rootPath) return new FileGroup();

    const files = new Map<SupportedContent, string>();
    
    if (fs.existsSync(fsPath)) {
      files.set(contentType.supports, fsPath);
    }

    const parsed = path.parse(rootPath);
    const name = parsed.name;

    knownPatterns.forEach((search) => {

      if (contentType.has(search.type)) return;
      if (files.has(search.type)) return;

      const matches = glob.sync(path.join(parsed.dir, search.subdir, `${name}${search.pattern}`));
      if (matches && matches.length > 0) {
        files.set(search.type, matches[0]); // get only first match
      }
    });

    return new FileGroup(files);
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

    if (fileGroup.files.size > 0) {
      const parsed = path.parse(newName);
      const neP = parsed.base.replace(/(.*)(?=\.md)$/gi, parsed.name);
      const newPart = path.join(parsed.dir, neP);

      for (const oldName of fileGroup.files.values()) {
        const oldExt = path.parse(oldName).ext;

        const newName = `${newPart}${oldExt}`;

        const shouldRename = await question(oldName, newName);
        if (shouldRename) fs.renameSync(oldName, newName);
        logger.info('renamed: ' + oldName);
      };
    }
  }

}

export const fileManager = new FileManager();
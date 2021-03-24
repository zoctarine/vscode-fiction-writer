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
  },
  related: {
    pattern: '.{[yY][mM][lL],[tT][xX][tT]}'
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
  isEmpty(): boolean;
}



class FileGroup implements IFileGroup {
  public static readonly EMPTY: IFileGroup = new FileGroup(); 
  public files: Map<SupportedContent, string>;

  constructor(files?: Map<SupportedContent, string>) { 
    if (!files)
      this.files = new Map<SupportedContent, string>();
    else
      this.files = files;
  }
  isEmpty(): boolean {
    return this.files.size === 0;
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
    return fsPath.replace(/(\.yml|\.txt)*$/gi, '');
  }


  public getGroup(fsPath: string): IFileGroup{
    const contentType = this.getPathContentType(fsPath, true);
    if (!contentType.isKnown()) return FileGroup.EMPTY;
    
    const rootPath = this.getRoot(fsPath);
    if (!rootPath) return FileGroup.EMPTY;

    const files = new Map<SupportedContent, string>();
    if (fs.existsSync(rootPath)) {
      files.set(SupportedContent.Fiction, rootPath);
    }

    const matches = glob.sync(`${rootPath}${knownFileTypes.related.pattern}`);

    matches.forEach((match) => {
      const foundContentType = this.getPathContentType(match, true); // get only first match
      if (files.has(foundContentType.supports)) return;
      files.set(foundContentType.supports, match); 
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

      for (let [type, oldName] of fileGroup.files.entries()) {
        const oldExt = path.parse(oldName).ext;

        const newName = type === SupportedContent.Fiction 
        ? newPart
        : `${newPart}${oldExt}`;

        const shouldRename = await question(oldName, newName);
        if (shouldRename) {
          fs.renameSync(oldName, newName);
          logger.info(`renamed: ${oldName} to ${newName}`);
        }
      };
    }
  }

}

export const fileManager = new FileManager();
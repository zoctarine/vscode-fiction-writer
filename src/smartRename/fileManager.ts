import * as vscode from 'vscode';
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';

import { Constants, ContentType, getActiveEditor, IObservable, logger, Observer, RegEx, SupportedContent } from '../utils';
import { extract } from '../metadata';
import { Config } from '../config';

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

const knownPatterns: { type: SupportedContent, pattern: string, subdir: string }[] = [
  { type: SupportedContent.Fiction, pattern: knownFileTypes.fiction.pattern, subdir: '' },
  { type: SupportedContent.Metadata, pattern: knownFileTypes.metadata.pattern, subdir: '' },
  { type: SupportedContent.Notes, pattern: knownFileTypes.notes.pattern, subdir: '' },
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



export class FileManager extends Observer<Config>{

  constructor(configService: IObservable<Config>) {
    super(configService);
  }

  moveToFolder(fsPath?: string) {
    if (!fsPath) return;
    if (!this.getPathContentType(fsPath).isKnown()) return;

    {
      try {
        const oldFile = fsPath;
        const parsed = path.parse(oldFile);
        const dirPath = path.join(parsed.dir, Constants.WorkDir);
        const newFile = path.join(dirPath, parsed.base);

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath);
        }
        fs.renameSync(oldFile, newFile);
      } catch (error) {
        vscode.window.showErrorMessage(`Could not move '${fsPath}' to resources folder.`);
      }
    };

  }

  public normalize(fsPath: string): string {
    return path.normalize(fsPath).replace(/\\/g, '/');
  }

  public getRoot(fsPath: string): string | undefined {
    if (!path) return undefined;

    fsPath = path.normalize(fsPath);
    const contentType = this.getPathContentType(fsPath);
    if (!contentType.isKnown()) return undefined;

    // get main .md path
    return fsPath.replace(/(\.yml|\.txt)*$/gi, '');
  }


  public getGroup(fsPath: string): IFileGroup {
    const contentType = this.getPathContentType(fsPath, true);
    if (!contentType.isKnown()) return FileGroup.EMPTY;

    const rootPath = this.getRoot(fsPath);
    if (!rootPath) return FileGroup.EMPTY;

    const files = new Map<SupportedContent, string>();
    if (fs.existsSync(rootPath)) {
      files.set(SupportedContent.Fiction, rootPath);
    }
    const posixBaseDir = rootPath.split(path.sep).join(path.posix.sep);
    const p = `${posixBaseDir}${knownFileTypes.related.pattern}`;

    const matches = glob.sync(p);

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

  public async splitDocument(selectedExtraction?: string) {
    const editor = getActiveEditor(SupportedContent.Fiction);
    if (editor && editor.selection) {

      let selectionText = editor.document.getText(editor.selection);


      let extractOptions = [];
      extractOptions.push(Constants.SplitOptions.SPLIT_AT_SELECTION_LINE);
      extractOptions.push(Constants.SplitOptions.SPLIT_AT_SELECTION);

      if (!editor.selection.isEmpty) {
        if (selectionText.length > 0) {
          extractOptions.push(Constants.SplitOptions.EXTRACT_SELECTION);
        }
      }

      if (!selectedExtraction) {
        selectedExtraction = await vscode.window.showQuickPick(extractOptions, {
          canPickMany: false,
          placeHolder: 'Split current document'
        });
      }

      let extractFrom = undefined;
      let extractTo = undefined;
      const lastLine = editor.document.lineAt(editor.document.lineCount - 1).range.end;

      switch (selectedExtraction) {
        case Constants.SplitOptions.SPLIT_AT_SELECTION:
          extractFrom = editor.selection.start;
          extractTo = lastLine;
          break;
        case Constants.SplitOptions.SPLIT_AT_SELECTION_LINE:
          extractFrom = editor.document.lineAt(editor.selection.start.line).range.start;
          extractTo = lastLine;
          break;
        case Constants.SplitOptions.EXTRACT_SELECTION:
          extractFrom = editor.selection.start;
          extractTo = editor.selection.end;
          break;
      }

      if (!extractFrom || !extractTo) return;

      selectionText = editor.document.getText(editor.selection);
      let newDocument = createDocumentNameFromSelection(editor.document.fileName, selectionText);
      if (!newDocument.filename || newDocument.filename.length === 0) {
        newDocument = createDocumentNameFromPath(editor.document.fileName);
      }

      const splitRange = new vscode.Range(extractFrom, extractTo);

      const selFilename = await vscode.window.showInputBox({
        value: `${newDocument.filename}${newDocument.ext}`,
        valueSelection: [0, newDocument.filename.length]
      });

      if (!selFilename) return;

      try {
        const splitText = editor.document.getText(splitRange);
        const newFilePath = path.join(newDocument.filepath, selFilename);
        fs.writeFileSync(newFilePath, splitText);
        vscode.workspace.openTextDocument(newFilePath);
        editor.edit(eb => eb.delete(splitRange));

        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(newFilePath));

      } catch (err) {
        vscode.window.showErrorMessage(`${selFilename} is not a valid file name`);
      }
    }
  }
}


function createDocumentNameFromPath(fileToSplit: string): { filename: string, filepath: string, ext: string } {
  const parsed = path.parse(fileToSplit);
  let fileName = parsed.name;

  let lastNumber = fileName.match(RegEx.ENDING_NUMBER);
  let start = 0;
  if (lastNumber) {
    start = parseInt(lastNumber[0], 10);
    fileName = fileName.replace(RegEx.ENDING_NUMBER, '');
  }

  fileName = fileName + `${++start}`;

  return {
    filename: fileName,
    filepath: path.normalize(parsed.dir),
    ext: parsed.ext
  };
}

function createDocumentNameFromSelection(fileToSplit: string, selectionText: string): { filename: string, filepath: string, ext: string } {
  const parsed = path.parse(fileToSplit);
  let fileName = '';
  if (selectionText && selectionText.length > 0) {
    fileName = selectionText.replace(/[^a-zA-Z0-9 -]/gi, '').trim().substr(0, 90);
  };

  return {
    filename: fileName,
    filepath: path.normalize(parsed.dir),
    ext: parsed.ext
  };
}

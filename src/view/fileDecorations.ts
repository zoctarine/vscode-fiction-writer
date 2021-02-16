import { Event, EventEmitter, Uri } from 'vscode';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Observer, IObservable } from '../observable';
import { Config } from '../config';

export class FileTagDecorationProvider extends Observer<Config> implements vscode.FileDecorationProvider {
  private decorations: { [key: string]: vscode.FileDecoration };

  constructor(observable: IObservable<Config>) {
    super(observable);

    this.decorations = {};
    this.loadDecorations();
    this.register();
  }

  private register() {
    this.clearDisposable('FD', 'SV');

    if (this.state.viewFileTagsEnabled) {
      this.addDisposable(vscode.window.registerFileDecorationProvider(this), 'FD');
      this.addDisposable(vscode.workspace.onDidSaveTextDocument(e => this.fire([e.uri])), 'SV');
    }
  }

  private loadDecorations() {
    this.decorations = {};

    Object
      .getOwnPropertyNames(this.state.viewFileTags)
      .forEach(p => {
        const badge = this.state.viewFileTags![p].substr(0, 2);
        if (badge && badge.length > 0) {
          this.decorations[p] = new vscode.FileDecoration(badge, p);
          this.decorations[badge] = new vscode.FileDecoration(badge, p);
        }
      });
  }

  protected onStateChange(newState: Config) {
    let prev = { ...this.state };
    
    super.onStateChange(newState);
    
    if (newState.viewFileTags != prev.viewFileTags || newState.viewFileTagsEnabled != prev.viewFileTagsEnabled) {
      this.loadDecorations();
      this.register();

      const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
      let files = fs.readdirSync(folder);
      // TODO: check if is directory
      // recurring search
      this.fire(files.map(f => Uri.file(path.join(folder, f))));
    }
  }

  private readonly _onDidChangeDecorations = new EventEmitter<Uri[]>();
  readonly onDidChangeFileDecorations: Event<Uri[]> = this._onDidChangeDecorations.event;

  provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration> {
    return new Promise((resolve, reject) => {
      if (!uri.fsPath.endsWith('.md')) reject();
      try {
        let buffer = '';
        let rs = fs.createReadStream(uri.fsPath, { encoding: 'utf8', highWaterMark: 256 });
        let pos = 0;
        let index;
        rs
          .on('data', data => {
            index = data.indexOf('\n');
            buffer += data;
            if (index !== -1) {
              pos += index;
              rs.close();
            } else {
              pos += data.length;
            }
          })
          .on('close', () => {
            let line = buffer.slice(buffer.charCodeAt(0) === 0xFEFF ? 1 : 0, pos)
            let match = /(?:(\/\/\s+))([\p{L}\p{N}\-_]+)/giu.exec(line);
            let dec: vscode.FileDecoration;
            if (match && match.length >= 3 && (dec = this.decorations[match[2]]))
              resolve(dec);
            else
              reject();
          })
          .on('error', err => reject(err));
      } catch (error) {
        console.log("Err: " + error);
        reject(error);
      }
    });
  }

  fire(uri: Uri[]) {
    this._onDidChangeDecorations.fire(uri);
  }
}
import * as vscode from 'vscode';
import * as fs from 'fs';
import { extractMetadata } from './index';
import { IObservable, Observer } from '../utils';
import { Config, IKvp } from '../config';
import { InMemoryCache } from '../utils';

export interface IFileInfo {
  id: string,
  metadata: any
}

export class MetadataFileCache extends Observer<Config> {
  private _fileCache: InMemoryCache<IFileInfo>;
  constructor(configService: IObservable<Config>) {
    super(configService);
    this._fileCache = new InMemoryCache();
    this.addDisposable(this._fileCache);
  }

  public get(path?: vscode.Uri): IFileInfo | undefined {
    if (!path) return undefined;

    const info = this._fileCache.get(path.fsPath);

    return info
      ? this.prepareMeta(info)
      : this.refresh(path);
  }

  public refresh(path?: vscode.Uri): IFileInfo | undefined {
    if (!path) return undefined;

    try {
      const filePath = path.fsPath;
      let fileInfo: IFileInfo | undefined = undefined;
      if (fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, 'utf8');
        const meta = this.getMeta(text);
        fileInfo = {
          id: meta?.id,
          metadata: meta
        };
        this._fileCache.set(path.fsPath, fileInfo);

        fileInfo.metadata = this.prepareMeta(fileInfo.metadata);
      }
      return fileInfo;

    } catch (error) {
      return undefined;
    }
  }

  private getMeta(text: string): any {
    return extractMetadata(text);
  }

  private prepareMeta(meta: any): any {
    // if is not a truthy value, return it
    if (!meta) return meta;

    // if is string, try to assign to default tag category
    if (this.state.metaEasyLists && this.state.metaEasyLists.length > 0 && typeof (meta) === 'string' && this.state.metaDefaultCategory) {
      const tags = meta.split(this.state.metaEasyLists).map(t => t.trim()).filter(m => m);
      let newMeta: IKvp<string[] | string> = {};
      newMeta[this.state.metaDefaultCategory] = tags.length > 1 ? tags : tags[0];
      return newMeta;
    }

    // if is not object return
    if (typeof (meta) !== 'object') return meta;

    // if is object, go through all known categories, and parse "easy arrays"
    const cats = [...this.state.metaCategories.keys()].map(c => c.toLowerCase());
    let newMeta = meta as { [key: string]: any };
    if (!newMeta) return meta;

    for (const [key, val] of Object.entries(meta)) {
      const val = newMeta[key];
      if (this.state.metaEasyLists && this.state.metaEasyLists.length > 0 && cats.includes(key.toLowerCase()) && typeof (val) === 'string') {
        const tags = val.split(this.state.metaEasyLists).map(t => t.trim()).filter(m => m);
        newMeta[key] = tags.length > 1 ? tags : tags[0];
      }
    }

    return meta;
  }

  public getAllKeys(): string[] {
    return this._fileCache.getAllKeys();
  }

  public remove(path: vscode.Uri) {
    return this._fileCache.remove(path.fsPath);
  }
}

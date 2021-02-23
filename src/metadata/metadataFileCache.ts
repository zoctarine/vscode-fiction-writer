import * as vscode from 'vscode';
import * as fs from 'fs';
import { extractMetadata } from './index';
import { IDisposable, IObservable, Observable, Observer } from '../utils';
import { Config, IKvp } from '../config';

const EASY_ARRAY_SEPARATOR = ',';

export interface IFileInfo {
  metadata: any
}
export class FileInfoCache implements IDisposable {
  private state?: Map<string, IFileInfo>;

  constructor() {
    this.state = new Map<string, IFileInfo>();
  }

  public set(path: vscode.Uri, info: IFileInfo): void {
    if (!this.state || !path) return;

    console.log('CACHE: set/save: ' + path);
    this.state.set(path.fsPath, info);
  }

  public get(path: vscode.Uri): Promise<IFileInfo | undefined> {
    if (!this.state || !path) return Promise.resolve(undefined);

    return Promise.resolve(this.state.get(path.fsPath));
  }

  public getAllKeys(): string[]{
    if (!this.state) return [];

    return [...this.state.keys()];
  }
  public dispose() {
    this.state?.clear();
    this.state = undefined;
  }
}

export class MetadataFileCache extends Observer<Config> {
  private _fileCache: FileInfoCache;
  constructor(configService: IObservable<Config>){
    super(configService);
    this._fileCache = new FileInfoCache();
    this.addDisposable(this._fileCache);
  }

  public get(path?: vscode.Uri): Promise<IFileInfo | undefined> {
    if (!path)
      return Promise.resolve(undefined);
    return new Promise((resolve, reject) => {
      this
        ._fileCache
        .get(path)
        .then(result => {
          resolve(result ?? this.refresh(path));
        })
        .catch(reject);
    });
  }

  public refresh(path: vscode.Uri): Promise<IFileInfo | undefined> {
    return new Promise((resolve, reject) => {
      try {
        const filePath = path.fsPath;
        let metadata: IFileInfo | undefined = undefined;
        if (fs.existsSync(filePath)) {
          const text = fs.readFileSync(filePath, 'utf8');
          metadata = {
            metadata: this.getMeta(text)
          };
          this._fileCache.set(path, metadata);
        }

        resolve(metadata);

      } catch (error) {
        reject(error);
      }
    });
  }

  private getMeta(text:string): any {
    let meta = extractMetadata(text);

    // if is not a truthy value, return it
    if (!meta) return meta;
    
    // if is string, try to assign to default tag category
    if (typeof(meta) === 'string'){
      const tags = meta.split(EASY_ARRAY_SEPARATOR).map(t => t.trim()).filter(m => m);
      let newMeta: IKvp<string[]|string> = {};
      newMeta[this.state.metaCatDefault] = tags.length > 1 ? tags : tags[0];
      return newMeta;
    } 
    
    // if is not object return
    if(typeof(meta) !== 'object') return meta;
    
    // if is object, go through all known categories, and parse "easy arrays"
    const cats = [...this.state.metaCategories.keys()].map(c => c.toLowerCase());
    let newMeta = meta as {[key:string]: any};
    if (!newMeta) return meta;

    for (const [key, val] of Object.entries(meta)) {
      const val = newMeta[key];
      if (cats.includes(key.toLowerCase()) && typeof(val) === 'string'){
        const tags = val.split(EASY_ARRAY_SEPARATOR).map(t => t.trim()).filter(m => m);
        newMeta[key] = tags.length > 1 ? tags : tags[0];
      }
    }
  
    return meta;
  }

  public getAllKeys():string[] {
    return this._fileCache.getAllKeys();
  }
}

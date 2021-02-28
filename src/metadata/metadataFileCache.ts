import * as vscode from 'vscode';
import * as fs from 'fs';
import { extractMetadata } from './index';
import { IDisposable, IObservable, Observer } from '../utils';
import { Config, IKvp } from '../config';

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
          resolve(result ? this.prepareMeta(result) : this.refresh(path));
        })
        .catch(reject);
    });
  }

  public refresh(path?: vscode.Uri): Promise<IFileInfo | undefined> {
    if (!path)
    return Promise.resolve(undefined);
    
    return new Promise((resolve, reject) => {
      try {
        const filePath = path.fsPath;
        let fileInfo: IFileInfo | undefined = undefined;
        if (fs.existsSync(filePath)) {
          const text = fs.readFileSync(filePath, 'utf8');
          fileInfo = {
            metadata: this.getMeta(text)
          };
          this._fileCache.set(path, fileInfo);
          
            fileInfo.metadata = this.prepareMeta(fileInfo.metadata);
        }
        resolve(fileInfo);

      } catch (error) {
        reject(error);
      }
    });
  }

  private getMeta(text:string): any {
    return extractMetadata(text);
  }

  private prepareMeta(meta: any): any {
    // if is not a truthy value, return it
    if (!meta) return meta;
    
    // if is string, try to assign to default tag category
    if (this.state.metaEasyLists && this.state.metaEasyLists.length > 0 && typeof(meta) === 'string' && this.state.metaDefaultCategory){
      const tags = meta.split(this.state.metaEasyLists).map(t => t.trim()).filter(m => m);
      let newMeta: IKvp<string[]|string> = {};
      newMeta[this.state.metaDefaultCategory] = tags.length > 1 ? tags : tags[0];
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
      if (this.state.metaEasyLists && this.state.metaEasyLists.length > 0 && cats.includes(key.toLowerCase()) && typeof(val) === 'string'){
        const tags = val.split(this.state.metaEasyLists).map(t => t.trim()).filter(m => m);
        newMeta[key] = tags.length > 1 ? tags : tags[0];
      }
    }
  
    return meta;
  }

  public getAllKeys():string[] {
    return this._fileCache.getAllKeys();
  }
}

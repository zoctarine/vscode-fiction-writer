import * as vscode from 'vscode';
import { IObservable, Observer, SupportedContent } from '../utils';
import { Config, IKvp } from '../config';
import { FileIndexer } from '../compile';
import { fileManager } from '../smartRename';
import { IMetadata } from '.';

export interface IFileInfo {
  key: string,
  path?: string,
  id?: string,
  metadata?: IMetadata,
  notes?: INotes
}

export interface INotes {
  path?: string
}

export class MetadataFileCache extends Observer<Config> {

  constructor(private fileIndex: FileIndexer, configService: IObservable<Config>) {
    super(configService);
    this.fileIndex.attach(this);
  }

  public get(path?: vscode.Uri): IFileInfo | undefined {
    if (!path) return undefined;
    const group = fileGroup(path.fsPath);

    const info = this.fileIndex.getByPath(path.fsPath);
    if (info?.metadata?.value){
      info.metadata.value = this.prepareMeta(info?.metadata?.value);
    }

    return info ?? undefined;
  }


  private prepareMeta(meta: any): any {
    try {
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
      return newMeta;
    } catch {
      return meta;
    }
  }

  public getAllKeys(): string[] {
    return this.fileIndex.paths();
  }
}

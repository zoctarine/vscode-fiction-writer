import { glob } from "glob";
import * as path from 'path';
import { extractMetadata, IFileInfo, KnownMeta } from "../metadata";
import { IDisposable, InMemoryCache } from "../utils";

export class FileIndexer implements IDisposable {
  private fileInfos: InMemoryCache<IFileInfo>;
  private fileIds: InMemoryCache<string>;

  constructor() {
    this.fileIds = new InMemoryCache<string>();
    this.fileInfos = new InMemoryCache<IFileInfo>();
  }

  public indexLocation(baseDir: string, pattern: string): Promise<string[]> {
    if (!baseDir || !pattern) return Promise.reject('error');

    const p = path.join(baseDir, pattern);
    return new Promise((resolve, reject) => {

      glob(p, {}, (err, matches) => {
        if (err) reject(err);
        matches.forEach(this.index);
        resolve(matches);
      });
    });
  }

  public index(path: string) {
    if (!path || path === '') return;
    let fileInfo: IFileInfo | undefined = undefined;

    try {
      const meta = extractMetadata(path) as KnownMeta;
      if (meta?.id) {
        this.fileIds.set(meta.id, path);
      }
      fileInfo = {
        id: meta?.id,
        metadata: meta
      };
    } catch (err) {
      console.error(`Could not read [${path}]: ${err}`);
    } finally {
      this.fileInfos.set(path, fileInfo);
    }
  }
  public path(id: string) : string | null | undefined
  { return this.fileIds.get(id); }

  public info(path: string) : IFileInfo | null | undefined
  { return this.fileInfos.get(path); }


  public paths(): string[] { return this.fileInfos.getAllKeys(); }

  public ids(): string[] { return this.fileIds.getAllKeys(); }

  public clear() { 
    this.fileIds.clear(); 
    this.fileInfos.clear();
   }

  dispose() { this.clear(); }
}
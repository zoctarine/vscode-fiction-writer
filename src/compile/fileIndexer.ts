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
      try {
        const matches = glob.sync(p, { nodir: true });
        matches.forEach(match => this.index(match));
        resolve(this.paths());
      } catch (error) {
        reject(error);
      }
    });
  }

  public index(path?: string) : IFileInfo | undefined {
    if (!path || path === '') return;
    let fileInfo: IFileInfo = {
      path: path,
    };

    try {
      const meta = extractMetadata(path) as any;
      if (meta?.id) {
        this.fileIds.set(meta.id, path);
      }
      fileInfo.id = meta?.id;
      fileInfo.metadata = meta;
    } catch (err) {
      console.error(`Could not read [${path}]: ${err}`);
    } finally {
      this.fileInfos.set(path, fileInfo);
    }
    return fileInfo;
  }
  public getById(id: string): IFileInfo | null | undefined {
    const path = this.fileIds.get(id);

    return path
      ? this.fileInfos.get(path)
      : undefined;
  }

  public getByPath(path: string): IFileInfo | null | undefined { return this.fileInfos.get(path); }

  public delete(path: string) {
    const file = this.fileInfos.get(path);
    if (file) {

      if (file.id) this.fileIds.remove(file.id);

      this.fileInfos.remove(path);
    }
  }

  public paths(): string[] { return this.fileInfos.getAllKeys(); }

  public ids(): string[] { return this.fileIds.getAllKeys(); }

  public clear() {
    this.fileIds.clear();
    this.fileInfos.clear();
  }

  dispose() { this.clear(); }
}
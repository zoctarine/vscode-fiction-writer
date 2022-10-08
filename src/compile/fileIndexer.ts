import * as glob from 'glob';
import * as path from 'path';
import { IFileInfo, MetadataService } from "../metadata";
import { FileManager } from '../smartRename';
import { logger, IDisposable, InMemoryCache, Observable, SupportedContent } from "../utils";

export interface IIndexOptions {
  skipNotify?: boolean;
  skipIndexedLocations?: boolean;
}

export class FileIndexer extends Observable<IFileInfo[]> implements IDisposable {
  private fileInfos: InMemoryCache<IFileInfo>;

  constructor(private metaService: MetadataService, private fileManager: FileManager) {
    super();
    this.fileInfos = new InMemoryCache<IFileInfo>();
  }

  public indexLocation(baseDir: string, pattern: string): Promise<string[]> {
    baseDir = baseDir.split(path.sep).join(path.posix.sep);
    if (!baseDir || !pattern) return Promise.reject('error');

    const p = path.posix.join(baseDir, pattern);
    return new Promise((resolve, reject) => {
      try {
        const matches = glob.sync(p, {  nodir: true });
        if (matches){
          matches.forEach(match => this.index(match, { skipNotify: true, skipIndexedLocations: true }));
          this.notify(matches);
        }
        resolve(this.keys());
      } catch (error) {
        reject(error);
      }
    });
  }

  public removeLocation(baseDir: string, pattern: string): Promise<string[]> {
    if (!baseDir || !pattern) return Promise.reject('error');

    const p = path.join(baseDir, pattern);
    return new Promise((resolve, reject) => {
      try {
        const matches = glob.sync(p, { nodir: true });
        matches.forEach(match => this.delete(match, false)); // do not want to notify for each file,
        this.notify(matches);                                // but only when parsing has finished
        resolve(this.keys());
      } catch (error) {
        reject(error);
      }
    });
  }

  private getKey(filePath: string): string {
    if (!filePath) return '';
    const rootFile = this.fileManager.getRoot(filePath);

    if (!rootFile) return '';
    return this.fileManager.normalize(rootFile);
  }


  public index(filePath?: string, options: IIndexOptions = {}): IFileInfo | undefined {
    if (!filePath || filePath === '') return;
    const key = this.getKey(filePath);

    if (options.skipIndexedLocations) {
      const existing = this.fileInfos.get(key);
      if (existing) return existing;
    }

    let fileInfo: IFileInfo = { key };

    try {
      const group = this.fileManager.getGroup(filePath);
      fileInfo.path = group.getPath(SupportedContent.Fiction);
      group.files.forEach(p => { logger.push(` - ${p}`); });
      logger.info(`Indexing: ${key}`);

      try {
        const meta = this.metaService.extractMetadata(group);
        fileInfo.id = meta?.value?.id;
        fileInfo.summary = meta?.value?.summary;
        fileInfo.metadata = meta;
      } catch { }

      try {
        const notes = group.getPath(SupportedContent.Notes);
        fileInfo.notes = notes ? { path: notes } : undefined;
      } catch { }
    } catch (err) {
      logger.error(`Could not read [${filePath}]: ${err}`);
    } finally {
      if (!fileInfo.path)
        this.fileInfos.remove(key);
      else
        this.fileInfos.set(key, fileInfo);
      if (!options.skipNotify) this.notify([filePath]);
    }
    return fileInfo;
  }

  public getById(id: string): IFileInfo[] {
    const result: IFileInfo[] = [];

    this.fileInfos
      .getSnapshot()
      .forEach(f => {
        if (f && f[1] && f[1].id === id) {
          result.push(f[1]);
        }
      });

    return result;
  }

  public getByPath(filePath?: string): IFileInfo | null | undefined {
    if (!filePath || filePath === '') return;
    const key = this.getKey(filePath);
    return this.fileInfos.get(key);
  }

  public delete(filePath: string, notify: boolean = true) {
    if (!filePath || filePath === '') return;
    const key = this.getKey(filePath);

    logger.info(`Removing: ${key}`);
    this.fileInfos.remove(key);

    if (notify) this.notify([filePath]);
  }

  public keys(): string[] { return this.fileInfos.getAllKeys(); }

  public clear() {
    this.fileInfos.clear();
    this.notify();
  }

  dispose() {
    super.dispose();
    this.clear();
  }

  getState(): IFileInfo[] {
    const allInfo = this.fileInfos.getSnapshot();
    if (allInfo) {
      return allInfo.map(s => {
        if (s[1]) return s[1];
        return {
          key: s[0]
        };
      });
    }
    return [];
  }
}
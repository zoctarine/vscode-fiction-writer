import * as glob from 'glob';
import * as path from 'path';
import { extractMetadata, IFileInfo, KnownMeta } from "../metadata";
import { fileManager } from '../smartRename';
import { ContentType, IDisposable, InMemoryCache, Observable, SupportedContent } from "../utils";

export class FileIndexer extends Observable<IFileInfo[]> implements IDisposable {
  private fileInfos: InMemoryCache<IFileInfo>;

  constructor() {
    super();
    this.fileInfos = new InMemoryCache<IFileInfo>();
  }

  public indexLocation(baseDir: string, pattern: string): Promise<string[]> {
    if (!baseDir || !pattern) return Promise.reject('error');

    const p = path.join(baseDir, pattern);
    return new Promise((resolve, reject) => {
      try {
        const matches = glob.sync(p, { nodir: true });
        matches.forEach(match => this.index(match, false)); // do not want to notify for each file,
        this.notify();                                      // but only when parsing has finished
        resolve(this.paths());
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
        this.notify();                                       // but only when parsing has finished
        resolve(this.paths());
      } catch (error) {
        reject(error);
      }
    });
  }

  private getKey(filePath: string): string {
    if (!filePath) return '';
    const parsed = path.parse(path.normalize(filePath));
    return path.join(parsed.dir, parsed.name);
  }

  public index(filePath?: string, notifyChange: boolean = true): IFileInfo | undefined {
    if (!filePath || filePath === '') return;
    const key = this.getKey(filePath);

    let fileInfo: IFileInfo = { key };

    try {
      const group = fileManager.getGroup(filePath);
      const meta = extractMetadata(group);
      const notes =  group.getPath(SupportedContent.Notes);

      fileInfo.id = meta?.value?.id;
      fileInfo.path = group.getPath(SupportedContent.Fiction);
      fileInfo.metadata = meta;
      fileInfo.notes = notes ? {path: notes} : undefined;

    } catch (err) {
      console.error(`Could not read [${filePath}]: ${err}`);
    } finally {
      this.fileInfos.set(key, fileInfo);
      if (notifyChange) this.notify();
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

    this.fileInfos.remove(key);

    if (notify) this.notify();
  }

  public paths(): string[] { return this.fileInfos.getAllKeys(); }

  public clear() {
    this.fileInfos.clear();
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
import * as glob from 'glob';
import * as path from 'path';
import { extractMetadata, fileGroup, IFileInfo, KnownMeta } from "../metadata";
import { ContentType, getPathContentType, IDisposable, InMemoryCache, isFictionOrMetadataUri, Observable } from "../utils";

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
        this.notify();                                 // but only when parsing has finished
        resolve(this.paths());
      } catch (error) {
        reject(error);
      }
    });
  }

  private getKey(filePath: string): string {
    if (!filePath) return '';
    const contentType = getPathContentType(filePath);
    if (contentType === ContentType.Fiction || contentType === ContentType.Metadata) {
      filePath = path.normalize(filePath);
      return fileGroup(filePath).path;
    }

    return filePath;
  }

  public index(filePath?: string, notifyChange: boolean = true): IFileInfo | undefined {
    if (!filePath || filePath === '') return;
    filePath = this.getKey(filePath);

    let fileInfo: IFileInfo = {
      path: filePath,
    };

    try {
      const meta = extractMetadata(filePath) as any;
      fileInfo.id = meta?.id;
      fileInfo.metadata = meta;
    } catch (err) {
      console.error(`Could not read [${filePath}]: ${err}`);
    } finally {
      this.fileInfos.set(filePath, fileInfo);
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

  public getByPath(filePath: string): IFileInfo | null | undefined {
    if (!filePath || filePath === '') return;
    filePath = this.getKey(filePath);

    return this.fileInfos.get(filePath);
  }

  public delete(filePath: string, notify: boolean = true) {
    if (!filePath || filePath === '') return;
    filePath = this.getKey(filePath);

    this.fileInfos.remove(filePath);

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
          path: s[0]
        };
      });
    }
    return [];
  }
}
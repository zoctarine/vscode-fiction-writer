import { glob } from "glob";
import * as path from 'path';

export class FileIndexer {
 
  constructor(private pattern: string) {
  }

  public indexLocation(dir: string): Promise<string[]> {
    const p = path.join(dir, this.pattern);
    return new Promise((resolve, reject) => {
      glob(p, {}, (err, matches) => {
        if (err) reject(err);
        // parse file
        // extract meta
        // save to cache
        resolve(matches);
      });
    });
  }
}
import { IDisposable } from '.';


export class InMemoryCache<T> implements IDisposable {
  private cache?: Map<string, T | undefined | null>;

  constructor() {
    this.cache = new Map<string, T>();
  }

  public set(key: string, value: T | undefined | null): void {
    if (!this.cache || !key) return;
    
    this.cache.set(key, value);
  }

  public get(key: string): T  | undefined | null{
    if (!this.cache || !key) return undefined;

    return this.cache.get(key);
  }

  public remove(key: string) {
    if (!this.cache || !key) return;

    this.cache.delete(key);
  }

  public getAllKeys(): string[] {
    if (!this.cache) return [];

    return [...this.cache.keys()];
  }

  public getCache() : Map<string, T | undefined | null> | undefined {
    return this.cache;
  }

  public getSnapshot(): [string, T | undefined | null][] {
    if (!this.cache)
      return [];

    return [...this.cache.entries()];
  }

  public clear() { this.cache?.clear(); }
  
  public dispose() {
    this.clear();
    this.cache = undefined;
  }
}

export interface IDisposable {
  dispose(): any;
}

export abstract class WithDisposables implements IDisposable {
  protected disposables: Map<string, IDisposable>;
  private static _lastId: number = 0;

  constructor() {
    this.disposables = new Map<string, IDisposable>();
  }

  getDisposable(key: string): IDisposable | undefined {
    return this.disposables.get(key);
  }

  addDisposable(disposable: IDisposable, key?: string) {
    if (!key) key = `id_${++WithDisposables._lastId}`;
    this.disposables.set(key, disposable);
  }

  clearDisposable(...keys:string[]) {
    keys.forEach(k => {
      this.getDisposable(k)?.dispose();
      this.disposables.delete(k);
    });
  }

  dispose() {
    this.disposables.forEach(d => d?.dispose());
    this.disposables.clear();
  }
}

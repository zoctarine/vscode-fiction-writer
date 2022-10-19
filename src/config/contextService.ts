import { Memento } from 'vscode';

export class ContextService {
  constructor(private _storage: Memento) {}

  public getValue<T>(key: string, defaultValue: T): T {
    return this._storage.get<T>(key, defaultValue);
  }

  public setValue<T>(key: string, value: T) {
    this._storage.update(key, value);
  }
}

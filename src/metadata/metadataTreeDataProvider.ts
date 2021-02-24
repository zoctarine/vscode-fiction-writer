import * as vscode from 'vscode';
import { Config } from '../config';
import { Constants, getActiveEditor, IObservable, KnownColor, Observer } from '../utils';
import { IFileInfo, MetadataFileCache } from './metadataFileCache';
import { MetadataTreeItem } from "./metadataTreeItem";


export class MarkdownMetadataTreeDataProvider extends Observer<Config> implements vscode.TreeDataProvider<MetadataTreeItem> {
  private document: vscode.TextDocument | undefined;
  private metadata: IFileInfo | undefined;

  constructor(configService: IObservable<Config>, private cache: MetadataFileCache) {
    super(configService);
  }

  getTreeItem(element: MetadataTreeItem): MetadataTreeItem {
    return element;
  }

  getChildren(element?: MetadataTreeItem): Thenable<MetadataTreeItem[]> {
    if (!this.document || !this.metadata) {
      return Promise.resolve([]);
    }
    const elements = element
      ? this.parseObjectTree(element.value, element)
      : this.parseObjectTree(this.metadata.metadata);

    const useColors = this.state.metaKeywordShowInMetadataView; 

    elements.forEach(item => {
      let icon: string | undefined = undefined;

      let label = item.parent?.key.toLowerCase();

      if (!label && item.description) {
          label = item.key.toLowerCase();
      }

      if (label && this.state.metaCategoryIconsEnabled) {
        icon = this.state.metaCategories.get(label);
        if (icon) {
          const keyword = item.description?.toString()?.toLowerCase();
          let color = keyword
            ? useColors && this.state.metaKeywordColors.get(keyword)
            : undefined;

          item.iconPath = new vscode.ThemeIcon(icon, color);
        }
      }
    });

    return Promise.resolve(elements);
  }

  private isArray(object: any): boolean { return Array.isArray(object); }
  private isObject(object: any): boolean { return typeof object === 'object' && object !== null; }

  private parseObjectTree(object: any, parent?: MetadataTreeItem): MetadataTreeItem[] {
    if (object === undefined || object === null)
      return [];

    if (Array.isArray(object)) {
      const r: any[] = [];
      object.map((value) => {
        const result = this.parseObjectTree(value, parent);
        r.push(...result);
      });
      return r;
    }
    if (typeof object === 'object' && object !== null) {
      return Object
        .getOwnPropertyNames(object)
        .map(p => {
          const value = object[p];
          if (Array.isArray(value)) {
            return new MetadataTreeItem(
              `${p}`,
              null,
              value,
              parent,
              vscode.TreeItemCollapsibleState.Expanded);
          };

          if (typeof value === 'object' && value !== null) {
            return new MetadataTreeItem(
              `${p}`,
              null,
              value,
              parent,
              vscode.TreeItemCollapsibleState.Expanded);
          }

          return new MetadataTreeItem(
            `${p}`,
            `${value}`,
            value,
            parent,
            vscode.TreeItemCollapsibleState.None);
        });
    }

    return [new MetadataTreeItem(``,
      `${object}`,
      object, parent)];
  }

  private _onDidChangeTreeData: vscode.EventEmitter<MetadataTreeItem | undefined | null | void> = new vscode.EventEmitter<MetadataTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<MetadataTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): Promise<IFileInfo | undefined> {

    return new Promise((resolve, reject) => {
      this.document = getActiveEditor()?.document;
      this.cache
        .get(this.document?.uri)
        .then(meta => {
          this.metadata = meta;
          this._onDidChangeTreeData.fire();
          resolve(this.metadata);
        })
        .catch(err => reject(err));
    });
  }

  clear(): void {
    this.document = undefined;
    this._onDidChangeTreeData.fire();
  }

  protected onStateChange(newState: Config) {
    super.onStateChange(newState);
    this.refresh();
  }
}

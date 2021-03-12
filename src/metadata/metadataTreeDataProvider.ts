import * as vscode from 'vscode';
import { Config } from '../config';
import { Constants, getActiveEditor, IObservable, KnownColor, Observer, SupportedContent } from '../utils';
import { IFileInfo, MetadataFileCache } from './metadataFileCache';
import { MetadataTreeItem } from "./metadataTreeItem";


export class MarkdownMetadataTreeDataProvider extends Observer<Config> implements vscode.TreeDataProvider<MetadataTreeItem> {
  private document: vscode.TextDocument | undefined;
  private fileInfo: IFileInfo | undefined;

  constructor(configService: IObservable<Config>, private cache: MetadataFileCache) {
    super(configService);
  }

  getTreeItem(element: MetadataTreeItem): MetadataTreeItem {
    return element;
  }

  getChildren(element?: MetadataTreeItem): Thenable<MetadataTreeItem[]> {
    if (!this.document || !this.fileInfo) {
      return Promise.resolve([]);
    }
    const elements = element
      ? this.parseObjectTree(element.value, element)
      : this.parseObjectTree(this.fileInfo?.metadata?.value);

    const useColors = this.state.metaKeywordShowInMetadataView;
    const showLabels = this.state.metaCategoryNamesEnabled ?? false;

    elements.forEach(item => {
      let icon: string | undefined = undefined;
      const metaLocation = this.fileInfo?.metadata?.location;
      if (metaLocation)
      item.command = {
        title: 'Open Meta',
        command: 'vscode.open',
        arguments: [
            vscode.Uri.file(metaLocation),
             {
              selection: new vscode.Range(new vscode.Position(0,0), new vscode.Position(0,0))
            }
        ]
      };

      let label = showLabels || item.parent
        ? item.parent?.key.toLowerCase()
        : item.key.toLowerCase();

      if (!label && item.description) {
        label = item.key.toLowerCase();
      }

      if (label && this.state.metaCategoryIconsEnabled) {
        icon = this.state.metaCategories.get(label) ?? 'debug-stackframe-dot';
        if (icon) {
        const keyword = showLabels ? item.description?.toString()?.toLowerCase() : item.label.toLowerCase();
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
    const showLabels = this.state.metaCategoryNamesEnabled ?? false;

    if (Array.isArray(object)) {
      const r: any[] = [];

      object.map((value) => {
        const result = this.parseObjectTree(value, parent);
        r.push(...result);
      });
      return r;
    }

    if (typeof object === 'object' && object !== null) {
      const props = Object.getOwnPropertyNames(object);
      if (!showLabels && props.length === 1) {
        return this.parseObjectTree(object[props[0]], new MetadataTreeItem(props[0], '', ''));
      }

      return props
        .map(key => {
          const value = object[key];
          if (Array.isArray(value)) {
            return new MetadataTreeItem(
              key,
              key,
              null,
              value,
              parent,
              vscode.TreeItemCollapsibleState.Expanded);
          }
          else
            if (typeof value === 'object' && value !== null) {
              return new MetadataTreeItem(
                key,
                key,
                null,
                value,
                parent,
                vscode.TreeItemCollapsibleState.Expanded);
            }

          return new MetadataTreeItem(
            key,
            showLabels ? key : value,
            showLabels ? value : '',
            value,
            parent,
            vscode.TreeItemCollapsibleState.None);
        });
    }

    return [new MetadataTreeItem(
      '',
      showLabels ? '' : object,
      showLabels ? object : '',
      object, parent)];
  }

  private _onDidChangeTreeData: vscode.EventEmitter<MetadataTreeItem | undefined | null | void> = new vscode.EventEmitter<MetadataTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<MetadataTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): Promise<IFileInfo | undefined> {

    return new Promise((resolve, reject) => {
      this.document = getActiveEditor(SupportedContent.Metadata)?.document;
      const meta = this.cache.get(this.document?.uri);
      if (meta) {
        this.fileInfo = meta;
        this._onDidChangeTreeData.fire();
        resolve(this.fileInfo);
      } else {
        reject();
      }
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

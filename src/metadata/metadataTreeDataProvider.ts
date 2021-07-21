import * as vscode from 'vscode';
import { Config } from '../config';
import { IObservable, Observer } from '../utils';
import { IFileInfo, MetadataFileCache } from './metadataFileCache';
import { MetadataTreeItem } from "./metadataTreeItem";

export class MarkdownMetadataTreeDataProvider extends Observer<Config> implements vscode.TreeDataProvider<MetadataTreeItem> {

  private _document: vscode.TextDocument | undefined;
  private _fileInfo: IFileInfo | undefined;
  public tree: vscode.TreeView<MetadataTreeItem> | undefined;

  constructor(configService: IObservable<Config>, private _cache: MetadataFileCache) {
    super(configService);
  }

  getTreeItem(element: MetadataTreeItem): MetadataTreeItem {
    return element;
  }

  getChildren(element?: MetadataTreeItem): Thenable<MetadataTreeItem[]> {
    if (!this._document || !this._fileInfo) {
      return Promise.resolve([]);
    }

    let elements = element
      ? this._parseObjectTree(element.value, element)
      : this._parseObjectTree(this._fileInfo?.metadata?.value);

    // Hide the 1st level `summary` category if it is shown as message
    if (this.state.metaSummaryCategoryEnabled){
      elements = elements.filter(e => e.key !== 'summary');
    }
    const useColors = this.state.metaKeywordShowInMetadataView;
    const showLabels = this.state.metaCategoryNamesEnabled ?? false;

    elements.forEach(item => {
      let icon: string | undefined = undefined;

      let label = showLabels || item.parent
        ? item.parent?.key.toLowerCase()
        : item.key.toLowerCase();

      if (!label && item.description) {
        label = item.key.toLowerCase();
      }

      if (label && this.state.metaCategoryIconsEnabled) {
        icon = this.state.metaCategories.get(label) ?? 'debug-stackframe-dot';
        if (icon) {
          const keyword = showLabels ? item.description?.toString()?.toLowerCase() : item.label?.toLowerCase();
          let color = keyword
            ? useColors && this.state.metaKeywordColors.get(keyword)
            : undefined;

          item.iconPath = new vscode.ThemeIcon(icon, color);
        }
      }
    });

    return Promise.resolve(elements);
  }

  open() {
    const metaLocation = this._fileInfo?.metadata?.location;
    if (metaLocation) {
      vscode.commands.executeCommand('vscode.open',
        vscode.Uri.file(metaLocation),
        {
          selection: new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(0, 0))
        }
      );
    };
  }

  private _isArray(object: any): boolean { return Array.isArray(object); }
  private _isObject(object: any): boolean { return typeof object === 'object' && object !== null; }

  private _parseObjectTree(object: any, parent?: MetadataTreeItem): MetadataTreeItem[] {
    if (object === undefined || object === null)
      return [];
    const showLabels = this.state.metaCategoryNamesEnabled ?? false;

    if (Array.isArray(object)) {
      const r: any[] = [];

      object.map((value) => {
        const result = this._parseObjectTree(value, parent);
        r.push(...result);
      });
      return r;
    }

    if (typeof object === 'object' && object !== null) {
      const props = Object.getOwnPropertyNames(object);
      if (!showLabels && props.length === 1) {
        return this._parseObjectTree(object[props[0]], new MetadataTreeItem(props[0], '', ''));
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

  refresh(forced?:boolean): Promise<IFileInfo | undefined> {
    this._document = vscode.window.activeTextEditor?.document;
    const meta = this._cache.get(this._document?.uri);

    if (!forced && this._fileInfo?.metadata?.location === meta?.metadata?.location)
      return Promise.resolve(this._fileInfo);
      
    return new Promise((resolve, reject) => {
      if (meta) {
        if (this.tree) {
          try {
            const values = meta.metadata?.value;
            this.tree.message = '';
            if (values) {
              if (this.state.metaSummaryCategoryEnabled) {
                this.tree.message = meta.summary;
              };
            }
          } catch (error) {
            //TODO: Log error
          }
        }
      }

      this._fileInfo = meta;
      this._onDidChangeTreeData.fire();
      return resolve(this._fileInfo);
    });
  }

  clear(): void {
    this._document = undefined;
    this._onDidChangeTreeData.fire();
  }

  protected onStateChange(newState: Config) {
    super.onStateChange(newState);
    const forced = newState.changeEvent?.affectsConfiguration('markdown-fiction-writer.metadata');
    this.refresh(forced);
  }
}

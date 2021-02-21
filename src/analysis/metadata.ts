import * as vscode from 'vscode';
import { ThemeIcon, TreeItem } from 'vscode';
import { Constants, getActiveEditor, RegEx } from '../utils';

import * as yaml from 'js-yaml';


function extract(text: string) {
  const exp = /(?:^---[\n\r]+)(.*?)(?:---|\.\.\.)/sgu;
  const result = exp.exec(text);
  if (result && result.length > 0) return result[1].trim();
  return '';
}

function parse(yamlText: string | undefined) {
  if (!yamlText) return undefined;

  const result = yaml.load(yamlText, {
    json: true // dplicate keys in a mapping will override values rather than throwing an error.
  });

  return result;
}

export interface Result<T> {
  value: T;
  hasValue: boolean;
}

/**
 * Extracts metadata object from a document
 * @param text the text from which to extract metadata from
 */
function extractMetadata(text: string): Result<string | object | number | undefined | null> {
  try {
    const metadataBlock = extract(text);
    const metadata = parse(metadataBlock);

    return {
      hasValue: metadata !== null && metadata !== undefined,
      value: metadata
    };
  } catch {
    return {
      hasValue: false,
      value: undefined
    };
  }
}

export class MetadataTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly desc: string,
    public readonly value: any,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
    public readonly commandId?: string
  ) {
    super(label, collapsibleState ?? vscode.TreeItemCollapsibleState.None);
    this.description = desc;

    let icon:string | undefined = undefined;
    switch (this.label.toLowerCase()){
      case 'tag':
      case 'tags':
        icon = 'tag'; break;
      case 'author':
        icon = 'edit'; break;
      case 'title':
        icon = 'symbol-type-parameter'; break;
      case 'character':
        icon = 'person'; break;
      case 'characters':
        icon = 'organization'; break;
    }

    this.desc = this.desc ?? '...'; 

    if (icon){
      this.iconPath = new ThemeIcon(icon);
    }
  }
}

export class MarkdownMetadataTreeDataProvider implements vscode.TreeDataProvider<MetadataTreeItem> {
  private document: vscode.TextDocument | undefined;
  private metadata: Result<any> | undefined;

  constructor() { }

  getTreeItem(element: MetadataTreeItem): MetadataTreeItem {
    return element;
  }

  getChildren(element?: MetadataTreeItem): Thenable<MetadataTreeItem[]> {
    if (!this.document || !this.metadata || !this.metadata.hasValue) {
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve(
        this.parseObjectTree(element.value)
      );
    } else {
      return Promise.resolve(
        this.parseObjectTree(this.metadata.value)
      );
    }
  }

  private isArray(object: any): boolean { return Array.isArray(object); }
  private isObject(object: any): boolean { return typeof object === 'object' && object !== null; }
  private isArrayOrObject(object: any): boolean { return this.isArray(object) || this.isObject(object); }

  private parseObjectTree(object: any): MetadataTreeItem[] {
    if (object === undefined || object === null) return [];

    if (Array.isArray(object)) {
      const r:any[] = [];
      object.map((value) => {
        const result = this.parseObjectTree(value);
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
            return new MetadataTreeItem(p,
              '',
              value,
              vscode.TreeItemCollapsibleState.Collapsed);
          };

          if (typeof value === 'object' && value !== null) {
            return new MetadataTreeItem(p,
              '',
              value,
              vscode.TreeItemCollapsibleState.Collapsed);
          }

          return new MetadataTreeItem(p,
            `${value}`,
            value,
            vscode.TreeItemCollapsibleState.None);
        });
    }

    return [new MetadataTreeItem(`${object}`,
      ``,
      object)];
  }

  private _onDidChangeTreeData: vscode.EventEmitter<MetadataTreeItem | undefined | null | void> = new vscode.EventEmitter<MetadataTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<MetadataTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this.document = getActiveEditor()?.document;
    const text = this.document?.getText();
    if (text) {
      this.metadata = extractMetadata(text);
    }
    this._onDidChangeTreeData.fire();
  }

  clear(): void {
    this.document = undefined;
    this._onDidChangeTreeData.fire();
  }
}

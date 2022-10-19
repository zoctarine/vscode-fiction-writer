import * as vscode from 'vscode';
import * as path from 'path';
import { FileIndexer } from '../compile';
import { Config } from '../config';
import { IFileInfo } from '../metadata';
import { Constants, getActiveEditor, IObservable, IObserver, KnownColor, Observer } from '../utils';
import { getFileTree } from '.';

class FileTreeItem extends vscode.TreeItem {
  children: FileTreeItem[] | undefined;

  constructor(public path: string, label: string, children?: FileTreeItem[]) {
    super(
      label,
      !children || children.length === 0
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded
    );
    this.children = children;
    this.command = {
      title: 'On Click',
      command: 'vscode.open',
      arguments: [vscode.Uri.file(this.path)],
    };
  }
}

export class ProjectFilesTreeDataProvider
  extends Observer<Config>
  implements vscode.TreeDataProvider<FileTreeItem>, IObserver<IFileInfo>
{
  constructor(configService: IObservable<Config>, private fileIndex: FileIndexer) {
    super(configService);
    this.fileIndex.attach(this);
  }

  getTreeItem(element: FileTreeItem): FileTreeItem {
    return element;
  }

  makeTree(name: string, path: string, children: FileTreeItem[]): FileTreeItem {
    const info = this.fileIndex.getByPath(path);
    const item = new FileTreeItem(path, name, children);
    if (info) {
      item.description = info.id;
    }
    return item;
  }

  getChildren(element?: FileTreeItem): Thenable<FileTreeItem[]> {
    if (element) {
      return Promise.resolve(element.children ?? []);
    }

    const indexes = this.fileIndex.getState();
    const elements = getFileTree(
      indexes.map(f => f.key),
      (name, path, children: FileTreeItem[]) => this.makeTree(name, path, children)
    );

    return Promise.resolve(elements);
  }

  private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | null | void> =
    new vscode.EventEmitter<FileTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  protected onStateChange(newState: Config) {
    super.onStateChange(newState);
    this._onDidChangeTreeData.fire();
  }
}

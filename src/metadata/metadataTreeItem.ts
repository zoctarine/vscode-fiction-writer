import * as vscode from 'vscode';


export class MetadataTreeItem extends vscode.TreeItem {
  constructor(
    public readonly key: string,
    public readonly displayValue: string | null | undefined,
    public readonly value?: any,
    public readonly parent?: MetadataTreeItem,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
    public readonly commandId?: string
  ) {
    super(key, collapsibleState ?? vscode.TreeItemCollapsibleState.None);
    if (displayValue) {
      this.description = displayValue;
      if (this.label)
        this.label += ':';
        this.tooltip = key;
    }

  }
}

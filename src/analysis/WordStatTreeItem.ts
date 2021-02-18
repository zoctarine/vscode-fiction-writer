import * as vscode from 'vscode';

export class WordStatTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly desc: string,
    public readonly count: number,
    public readonly tooltip: string,
    public readonly icon: vscode.ThemeIcon,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
    public readonly commandId?: string
  ) {
    super(label, collapsibleState ?? vscode.TreeItemCollapsibleState.None);
    this.description = desc;
    if (commandId){
      this.command = {
        title: 'On Click',
        command: commandId,
        arguments: [{ search: this.label }]
      }
    }
  }

  iconPath = this.icon;
}

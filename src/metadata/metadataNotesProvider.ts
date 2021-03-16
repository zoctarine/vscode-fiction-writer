import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IFileInfo } from '.';
import { FileIndexer } from '../compile';
import { getActiveEditor } from '../utils';

export class MetadataNotesProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'fw-notes';
  private _currentDocumentPath?: string;
  private _view?: vscode.WebviewView;
  private _noteText = '';
  private _fileInfo: IFileInfo | undefined | null;
  private _pinned: boolean = false;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _fileIndex: FileIndexer
  ) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {

        case 'saveNotes':
          {
            if (this._fileInfo?.notes?.path){
              fs.writeFileSync(this._fileInfo.notes.path, data.value);
            }
          }
      }
    });

    this._view = webviewView;
  }

  public newNotes() {
    if (this._fileInfo){
      const newNotePath = this._fileInfo.key + '.txt';
      fs.writeFileSync(newNotePath, 'YOUR NOTES HERE');
    }
  }

  public openNotes() {
    if (this._fileInfo?.notes?.path){
      vscode.commands.executeCommand('vscode.open', vscode.Uri.file(this._fileInfo.notes.path));
    }
  }

  public saveNotes() {
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders

      // Post a message to webview to ask for notes (will respond with 'saveNotes' message)
      this._view.webview.postMessage({ type: 'submitNotes' });
    }
  }

  public pin(): boolean {
    if (!this._pinned) {
      this._pinned = true;

      if (this._view && this._fileInfo?.notes?.path) {
        this._view.description = path.parse(this._fileInfo.notes.path).name;
      }

      return true;
    }

    return false;
  }

  public unPin(): boolean {
    if (this._pinned) {
      this._pinned = false;

      if (this._view) this._view.description = '';

      return true;
    }

    return false;
  }

  public refresh() {
    this.loadDocument(vscode.window.activeTextEditor?.document?.uri.fsPath);
  }

  public loadDocument(documentPath?: string) {
    if (this._pinned && this._currentDocumentPath !== documentPath) return;
    
    vscode.window.showWarningMessage('There are unsaved changes to your notes file. Do you want to save them now?', 'Yes', 'No')
    .then(result => {
      
      this._currentDocumentPath = documentPath;
      this._fileInfo = this._fileIndex.getByPath(documentPath);
      
      vscode.commands.executeCommand('setContext', 'fw:hasOpenedNote', this._fileInfo?.notes?.path);
      
      this.reloadWebView();
    })
  }

  private reloadWebView() {
    if (!this._fileInfo) return;

    const notePath = this._fileInfo?.notes?.path;

    this._noteText = '';
    let title = '';
    if (notePath) {
      if (fs.existsSync(notePath)) {
        title = path.parse(notePath).name;
        this._noteText = fs.readFileSync(notePath, 'utf8');
      }
    }

    if (this._view) {
      if (this._pinned) this._view.description = title;
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return this._fileInfo?.notes?.path ? `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Notes</title>
			</head>
			<body>
				<textarea id="fw-txt-notes">${this._noteText}</textarea>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>` : `<html></html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
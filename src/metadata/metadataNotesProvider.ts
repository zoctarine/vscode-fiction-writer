import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IFileInfo } from '.';
import { FileIndexer } from '../compile';
import { IObservable, IObserver, Observer } from '../utils';
import { Config } from '../config';

export class MetadataNotesProvider extends Observer<Config> implements vscode.WebviewViewProvider {
  private _currentDocumentPath?: string;
  private _view?: vscode.WebviewView;
  private _noteText = '';
  private _buffer = '';
  private _fileInfo: IFileInfo | undefined | null;
  private _pinned: boolean = false;
  private _isDisposed?: boolean;

  constructor(
    configService: IObservable<Config>,
    private readonly _extensionUri: vscode.Uri,
    private readonly _fileIndex: FileIndexer,
    private _disposables: vscode.Disposable[]
  ) {
    super(configService);
  }

  update(...args: any[]): void {
    super.update();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
    ) {

    this._isDisposed = false;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri
      ]
    };


    this._view = webviewView;

    this._reloadWebView();

    this._view.webview?.onDidReceiveMessage(data => {
      switch (data.type) {

        case 'saveNotes': this._save(data.value); break;
        case 'newNote': this.newNotes(); break;
        case 'changed':
          this._buffer = data.value;
          this._setTitle('NOTES*');
          break;
        }
      }, {}, this._disposables);

    this._view.onDidDispose(() => {
      this._isDisposed = true;
    });
  }

  private _setTitle(title: string) {
    try {
      if (!this._isDisposed && this._view) {
        this._view.title = title;
      };
    } catch (error) {
      console.log(error);
    }
  }
  public newNotes() {
    if (this._fileInfo?.path) {
      const newNotePath = this._fileInfo.path + '.txt';
      fs.writeFileSync(newNotePath, this.state.notesDefaultText);
    }
  }

  public openNotes() {
    if (this._fileInfo?.notes?.path) {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.file(this._fileInfo.notes.path));
    }
  }

  public saveNotes() {
    if (!this._isDisposed && this._view?.webview) {
      // Post a message to webview to ask for notes (will respond with 'saveNotes' message)
      this._view.webview?.postMessage({ type: 'submitNotes' });
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

  public async refresh(forced?: boolean) {
    await this._loadDocument(vscode.window.activeTextEditor?.document?.uri.fsPath, forced);
  }

  private async _loadDocument(documentPath?: string, forced?: boolean) {
    this._fileInfo = this._fileIndex.getByPath(documentPath);
    if (!forced && this._fileInfo?.notes?.path === this._currentDocumentPath && this._fileInfo?.notes?.path) return;

    if (this._pinned && (!forced || this._fileInfo?.notes?.path !== this._currentDocumentPath)) return;

    if (this._buffer !== this._noteText) {
      const answer = await vscode.window.showInformationMessage(
        `The notes view has unsaved changes. Do you want to overwrite ${this._currentDocumentPath} notes file?`, 'Yes', 'No');
      if (answer === 'Yes') {
        this._save(this._buffer);
      }
    }
    //save notes
    this._currentDocumentPath = this._fileInfo?.notes?.path;
    this._setTitle('NOTES');
    vscode.commands.executeCommand('setContext', 'fw:hasOpenedNote', this._currentDocumentPath);
    vscode.commands.executeCommand('setContext', 'fw:showNotes', this._fileInfo !== undefined);

    this._reloadWebView();
  }

  private _save(content: string) {
    if (this._currentDocumentPath) {
      this._buffer = content;
      this._noteText = content;
      fs.writeFileSync(this._currentDocumentPath, content);
    };
  }

  private _reloadWebView() {

    this._noteText = '';
    let title = '';
    if (this._currentDocumentPath) {
      if (fs.existsSync(this._currentDocumentPath)) {
        title = path.parse(this._currentDocumentPath).name;
        this._noteText = fs.readFileSync(this._currentDocumentPath, 'utf8');
      }
    }

    if (!this._isDisposed && this._view?.webview) {
      if (this._pinned) this._view.description = title;
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }

    this._buffer = this._noteText;
  }

  private _hasView() {
    return !this._isDisposed || this._view?.webview;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    if (!webview) return '';

    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
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
			<body>` +
      (this._fileInfo?.notes?.path
        ?	`<textarea id="fw-txt-notes">${this._noteText}</textarea>`
        : `<div class="welcome-view-content">
            <p>There are no notes for the current file group.</p>
            <div class="button-container">
              <button id="fw-txt-add-note">Add Note</button>
            </div>
          </div>`)
        +`
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
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
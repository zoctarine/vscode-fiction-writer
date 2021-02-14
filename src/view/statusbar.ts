import * as vscode from 'vscode';
import { IObservable, Observer } from '../observable';
import { Config } from './../config';

export class StatusBarObserver extends Observer<Config> implements vscode.Disposable {
  private compileButton: vscode.StatusBarItem;
  private foldButton: vscode.StatusBarItem;
  private unfoldButton: vscode.StatusBarItem;
  private settingsButton: vscode.StatusBarItem;
  private paragraphToggleButton: vscode.StatusBarItem;
  private typewriterToggleButton: vscode.StatusBarItem;
  private keybindingToggleButton: vscode.StatusBarItem;

  private dialogueMarkerSelector: vscode.StatusBarItem;

  constructor(configuration: IObservable<Config>) {
    super(configuration);

    // Toggle Keybindigns
    this.keybindingToggleButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.keybindingToggleButton.command = 'fiction-writer.extension.toggleKeybindings';
    this.updateKeybindingToggle();

    // Open Settings
    this.settingsButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.settingsButton.text = `$(settings-gear)`;
    this.settingsButton.command = {
      title: 'Open Settings', command: 'workbench.action.openSettings', arguments: [
        '@ext:vsc-zoctarine.markdown-fiction-writer']
    };

    // Toggle Paragraph On Enter
    this.paragraphToggleButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.paragraphToggleButton.command = 'fiction-writer.extension.toggleNewParagraph';
    this.paragraphToggleButton.tooltip = 'Toggle new paragraph on Enter'
    this.updateParagrahpToggle();

    // Toggle Typewriter Mode
    this.typewriterToggleButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.typewriterToggleButton.command = 'fiction-writer.extension.toggleTypewriterMode';
    this.typewriterToggleButton.tooltip = 'Toggle TypeWriter (focus) mode.'
    this.updateTypewriterToggle();

    // Export: Compile
    this.compileButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.compileButton.text = `$(desktop-download) Export`;
    this.compileButton.command = 'fiction-writer.extension.compile';

    this.foldButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.foldButton.text = `$(folding-collapsed)`;
    this.foldButton.command = 'editor.foldAllMarkerRegions';
    this.foldButton.tooltip = 'Fold all Sentences';

    this.unfoldButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.unfoldButton.text = `$(folding-expanded)`;
    this.unfoldButton.command = 'editor.unfoldAllMarkerRegions';
    this.unfoldButton.tooltip = 'Unfold All Sentences';

    this.dialogueMarkerSelector = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this.dialogueMarkerSelector.command = 'fiction-writer.extension.selectEditMode';
    this.dialogueMarkerSelector.tooltip = 'Select dialogue editing mode (change marker).';
    this.updateDialogueSelector();

    vscode.window.onDidChangeActiveTextEditor(e => this.showHide());
  }

  showHide() {
    if (vscode.window.activeTextEditor?.document?.languageId == 'markdown') {
      this.settingsButton.show();
      this.compileButton.show();
      this.unfoldButton.show();
      this.foldButton.show();
      this.typewriterToggleButton.show();
      this.paragraphToggleButton.show();
      this.keybindingToggleButton.show();
      this.dialogueMarkerSelector.show();
    } else {
      this.settingsButton.hide();
      this.keybindingToggleButton.hide();
      this.compileButton.hide();
      this.unfoldButton.hide();
      this.foldButton.hide();
      this.typewriterToggleButton.hide();
      this.paragraphToggleButton.hide();
      this.dialogueMarkerSelector.hide();
    }
  }

  updateDialogueSelector() {
    this.dialogueMarkerSelector.text = `$(comment-discussion) ${this.state.dialoguePrefix || '" "'}`;
  }

  updateKeybindingToggle() {
    if (this.state.keybindingsDisabled) {
      this.keybindingToggleButton.tooltip = 'Use fiction writer keybindings: disabled'
      this.keybindingToggleButton.text = `$(clear-all)`
    } else {
      this.keybindingToggleButton.tooltip = 'Use fiction writer keybindings: enabled'
      this.keybindingToggleButton.text = `$(keyboard)`
    }
  }

  updateParagrahpToggle() {
    this.paragraphToggleButton.text = this.state.inverseEnter
      ? `$(list-selection)`
      : `$(list-flat)`;
  }

  updateTypewriterToggle() {
    this.typewriterToggleButton.text = this.state.isTypewriterMode
      ? `$(circle-filled)`
      : `$(circle-outline)`;
  }

  update(): void {
    super.update();
    this.updateParagrahpToggle();
    this.updateTypewriterToggle();
    this.updateDialogueSelector();
    this.updateKeybindingToggle();
  }

  dispose() {
    this.compileButton.dispose();
    this.dialogueMarkerSelector.dispose();
    this.typewriterToggleButton.dispose();
    this.foldButton.dispose();
    this.unfoldButton.dispose();
    this.paragraphToggleButton.dispose();
    this.keybindingToggleButton.dispose();
    this.settingsButton.dispose();
  }

  public updateEditingType(newType: string) {
    this.dialogueMarkerSelector.text = newType;
  }
}
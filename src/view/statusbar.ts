import * as vscode from 'vscode';
import { IObservable, Observer, Constants, getActiveEditor, SupportedContent } from '../utils';
import { Config } from '../config';

export class StatusBarObserver extends Observer<Config>{
  private buttons: vscode.StatusBarItem[];
  private compileButton: vscode.StatusBarItem;
  private foldButton: vscode.StatusBarItem;
  private unfoldButton: vscode.StatusBarItem;
  private settingsButton: vscode.StatusBarItem;
  private paragraphToggleButton: vscode.StatusBarItem;
  private typewriterToggleButton: vscode.StatusBarItem;
  private keybindingToggleButton: vscode.StatusBarItem;
  private writingModeToggleButton: vscode.StatusBarItem;

  private dialogueMarkerSelector: vscode.StatusBarItem;

  constructor(configuration: IObservable<Config>) {
    super(configuration);

    this.buttons = [];

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
    this.settingsButton.tooltip = `Open extension settings`
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
    this.paragraphToggleButton.tooltip = 'Toggle new paragraph on Enter';
    this.updateParagraphToggle();

    // Toggle Typewriter Mode
    this.typewriterToggleButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.typewriterToggleButton.command = 'fiction-writer.extension.toggleTypewriterMode';
    this.typewriterToggleButton.tooltip = 'Toggle TypeWriter mode';
    this.updateTypewriterToggle();

    // Export: Compile
    this.compileButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.compileButton.text = `$(desktop-download) Export`;
    this.compileButton.tooltip = `Compile/Export document(s)`;
    this.compileButton.command = 'fiction-writer.extension.compile';

    this.foldButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.foldButton.text = `$(folding-collapsed)`;
    this.foldButton.command = 'editor.foldAllMarkerRegions';
    this.foldButton.tooltip = 'Fold all';

    this.unfoldButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.unfoldButton.text = `$(folding-expanded)`;
    this.unfoldButton.command = 'editor.unfoldAllMarkerRegions';
    this.unfoldButton.tooltip = 'Unfold All';

    this.dialogueMarkerSelector = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this.dialogueMarkerSelector.command = 'fiction-writer.extension.selectEditMode';
    this.dialogueMarkerSelector.tooltip = 'Select dialogue punctuation (change marker)';
    this.updateDialogueSelector();

    // Toggle Zen Mode
    this.writingModeToggleButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER,
    );
    this.writingModeToggleButton.command = Constants.Commands.TOGGLE_WRITING_MODE;
    this.writingModeToggleButton.tooltip = 'Toggle Writing Mode';
    this.updateWritingModeToggle();

    this.buttons.push(
      this.settingsButton,
      this.compileButton,
      this.unfoldButton,
      this.foldButton,
      this.writingModeToggleButton,
      this.typewriterToggleButton,
      this.paragraphToggleButton,
      this.keybindingToggleButton,
      this.dialogueMarkerSelector
    );
    this.buttons.forEach(b => this.addDisposable(b));

    this.showHide();
  }

  showHide() {

    if (getActiveEditor(SupportedContent.Fiction) && this.state.viewStatusBarEnabled) {
      this.buttons.forEach(b => b.show());
    } else {
      this.buttons.forEach(b => b.hide());
    }
  }

  updateDialogueSelector() {
    this.dialogueMarkerSelector.text = `$(comment-discussion) ${this.state.dialoguePrefix || '" "'}`;
  }

  updateKeybindingToggle() {
    if (this.state.keybindingsDisabled) {
      this.keybindingToggleButton.tooltip = 'Use fiction writer keybindings: disabled';
      this.keybindingToggleButton.text = `$(clear-all)`;
    } else {
      this.keybindingToggleButton.tooltip = 'Use fiction writer keybindings: enabled';
      this.keybindingToggleButton.text = `$(keyboard)`;
    }
  }

  updateWritingModeToggle() {
    this.writingModeToggleButton.text = this.state.isZenMode
      ? `$(discard)`
      : `$(zap)`
  }
  updateParagraphToggle() {
    this.paragraphToggleButton.text = this.state.inverseEnter
      ? `$(list-selection)`
      : `$(list-flat)`;
  }

  updateTypewriterToggle() {
    this.typewriterToggleButton.text = this.state.isTypewriterMode
      ? `$(circle-filled)`
      : `$(circle-outline)`;
  }

  protected onStateChange(newState: Config) {
    super.onStateChange(newState);

    this.updateParagraphToggle();
    this.updateTypewriterToggle();
    this.updateDialogueSelector();
    this.updateKeybindingToggle();
    this.updateWritingModeToggle();
  }
}
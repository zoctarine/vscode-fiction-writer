import * as vscode from 'vscode';
import { IObservable, Observer, Constants, getActiveEditor, SupportedContent } from '../utils';
import { Config } from '../config';

export class StatusBarObserver extends Observer<Config> {
  private _buttons: vscode.StatusBarItem[];
  private _compileButton: vscode.StatusBarItem;
  private _foldButton: vscode.StatusBarItem;
  private _unfoldButton: vscode.StatusBarItem;
  private _settingsButton: vscode.StatusBarItem;
  private _paragraphToggleButton: vscode.StatusBarItem;
  private _typewriterToggleButton: vscode.StatusBarItem;
  private _keybindingToggleButton: vscode.StatusBarItem;
  private _writingModeToggleButton: vscode.StatusBarItem;

  private _dialogueMarkerSelector: vscode.StatusBarItem;

  constructor(configuration: IObservable<Config>) {
    super(configuration);

    this._buttons = [];

    // Toggle Keybindigns
    this._keybindingToggleButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this._keybindingToggleButton.command = 'fiction-writer.extension.toggleKeybindings';
    this.updateKeybindingToggle();

    // Open Settings
    this._settingsButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this._settingsButton.tooltip = 'Open extension settings'; // TODO: use new vscode.MarkdownString(``);
    this._settingsButton.text = `$(settings-gear)`;
    this._settingsButton.command = {
      title: 'Open Settings',
      command: 'workbench.action.openSettings',
      arguments: ['@ext:vsc-zoctarine.markdown-fiction-writer'],
    };

    // Toggle Paragraph On Enter
    this._paragraphToggleButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this._paragraphToggleButton.command = 'fiction-writer.extension.toggleNewParagraph';
    this._paragraphToggleButton.tooltip = 'Toggle new paragraph on Enter';
    this.updateParagraphToggle();

    // Toggle Typewriter Mode
    this._typewriterToggleButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this._typewriterToggleButton.command = 'fiction-writer.extension.toggleTypewriterMode';
    this._typewriterToggleButton.tooltip = 'Toggle TypeWriter mode';
    this.updateTypewriterToggle();

    // Export: Compile
    this._compileButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this._compileButton.text = `$(desktop-download) Export`;
    this._compileButton.tooltip = `Compile/Export document(s)`;
    this._compileButton.command = 'fiction-writer.extension.compile';

    this._foldButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this._foldButton.text = `$(folding-collapsed)`;
    this._foldButton.command = 'editor.foldAllMarkerRegions';
    this._foldButton.tooltip = 'Fold all';

    this._unfoldButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this._unfoldButton.text = `$(folding-expanded)`;
    this._unfoldButton.command = 'editor.unfoldAllMarkerRegions';
    this._unfoldButton.tooltip = 'Unfold All';

    this._dialogueMarkerSelector = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this._dialogueMarkerSelector.command = 'fiction-writer.extension.selectEditMode';
    this._dialogueMarkerSelector.tooltip = 'Select dialogue punctuation (change marker)';
    this.updateDialogueSelector();

    // Toggle Zen Mode
    this._writingModeToggleButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this._writingModeToggleButton.command = Constants.Commands.TOGGLE_WRITING_MODE;
    this._writingModeToggleButton.tooltip = 'Toggle Writing Mode';
    this.updateWritingModeToggle();

    this._buttons.push(
      this._settingsButton,
      this._compileButton,
      this._unfoldButton,
      this._foldButton,
      this._writingModeToggleButton,
      this._typewriterToggleButton,
      this._paragraphToggleButton,
      this._keybindingToggleButton,
      this._dialogueMarkerSelector
    );
    this._buttons.forEach(b => this.addDisposable(b));

    this.showHide();
  }

  private _updateVisibility(button: vscode.StatusBarItem, setting: string) {
    if (this.state.statusBarItems && !this.state.statusBarItems[setting]) {
      button.hide();
    } else {
      button.show();
    }
  }
  showHide() {
    if (getActiveEditor(SupportedContent.Fiction) && this.state.statusBarEnabled) {
      [
        [this._settingsButton, 'open_settings'],
        [this._compileButton, 'export'],
        [this._unfoldButton, 'unfold'],
        [this._foldButton, 'fold'],
        [this._writingModeToggleButton, 'writing_mode'],
        [this._typewriterToggleButton, 'typewriter_mode'],
        [this._paragraphToggleButton, 'new_paragraph_toggle'],
        [this._keybindingToggleButton, 'keybindings'],
        [this._dialogueMarkerSelector, 'dialogue_punctuation'],
      ].forEach(item => this._updateVisibility(item[0] as vscode.StatusBarItem, item[1] as string));
    } else {
      this._buttons.forEach(b => b.hide());
    }
  }

  updateDialogueSelector() {
    this._dialogueMarkerSelector.text = `$(comment-discussion) ${
      this.state.dialoguePrefix || '" "'
    }`;
  }

  updateKeybindingToggle() {
    if (this.state.keybindingsDisabled) {
      this._keybindingToggleButton.tooltip = 'Use fiction writer keybindings: disabled';
      this._keybindingToggleButton.text = `$(clear-all)`;
    } else {
      this._keybindingToggleButton.tooltip = 'Use fiction writer keybindings: enabled';
      this._keybindingToggleButton.text = `$(keyboard)`;
    }
  }

  updateWritingModeToggle() {
    this._writingModeToggleButton.text = this.state.isZenMode ? `$(discard)` : `$(zap)`;
  }
  updateParagraphToggle() {
    this._paragraphToggleButton.text = this.state.inverseEnter
      ? `$(list-selection)`
      : `$(list-flat)`;
  }

  updateTypewriterToggle() {
    this._typewriterToggleButton.text = this.state.isTypewriterMode
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
    this.showHide();
  }
}

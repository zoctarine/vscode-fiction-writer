import * as vscode from 'vscode';
import { QuickPickItem } from 'vscode';
import { ConfigService } from '../config';

export class WritingMode {
  constructor(private configService: ConfigService) {}

  exitWritingMode() {
    if (!this.configService.getState().isZenMode) return;

    this.configService.restore('workbench', 'colorTheme');
    this.configService.restore('editor', 'fontSize');
    this.configService.setLocal('isZenMode', false);

    if (this.configService.getState().viewZenModeToggleFocus) {
      const prevConfig = this.configService.getFlag('previousFocusMode');
      this.configService.setLocal<boolean>('isFocusMode', prevConfig);
    }
  }

  enterWritingMode() {
    if (this.configService.getState().isZenMode) false;

    const changeThemeTo = this.configService.getState().viewZenModeTheme;
    const changeFontTo = this.configService.getState().viewZenModeFontSize;

    if (changeThemeTo) {
      this.configService.backup('workbench', 'colorTheme');
      vscode.workspace.getConfiguration('workbench').update('colorTheme', changeThemeTo);
    }

    if (changeFontTo && changeFontTo > 0) {
      this.configService.backup('editor', 'fontSize');
      vscode.workspace.getConfiguration('editor').update('fontSize', changeFontTo);
    }
    if (this.configService.getState().viewZenModeToggleFocus) {
      const prevConfig = this.configService.getState().isFocusMode;
      if (prevConfig) this.configService.setFlag('previousFocusMode');
      else this.configService.unsetFlag('previousFocusMode');

      this.configService.setLocal<boolean>('isFocusMode', true);
    }

    this.configService.setLocal('isZenMode', true);
  }

  async toggleWritingMode(toggleZenMode?: boolean) {
    if (!this.configService.getFlag('isAgreeZenMode')) {
      const option = await vscode.window.showWarningMessage(
        'Writing overrides some editor settings.\n\n' +
          'It can be that some settings would need to be restored manually. Make sure  you turn WritingMode off before deactivating/uninstalling this extension.',
        'OK, Continue',
        'Cancel',
        'Read More'
      );

      if (option === 'OK, Continue') {
        this.configService.setFlag('isAgreeZenMode');
      }
      if (option === 'Read More') {
        vscode.env.openExternal(
          vscode.Uri.parse('https://zoctarine.github.io/vscode-fiction-writer/view/#writing-mode')
        );
      } else {
        return;
      }
    }

    if (toggleZenMode) {
      vscode.commands.executeCommand('workbench.action.toggleZenMode');
    }

    if (this.configService.getState().isZenMode) {
      this.exitWritingMode();
    } else {
      this.enterWritingMode();
    }
  }

  selectFullscreenFont() {
    let currentSizeSetting = this.configService.getState().viewZenModeFontSize?.toString();
    if (!currentSizeSetting) {
      currentSizeSetting = vscode.workspace.getConfiguration('editor').get('fontSize');
    }
    vscode.window
      .showInputBox({
        prompt: 'Writing Mode font size:',
        value: currentSizeSetting,
        validateInput: input => {
          const value = parseInt(input);
          if (value >= 5 && value <= 100) return null;
          return 'Value must be a number, greater than 0';
        },
      })
      .then(newSize => {
        if (!newSize) return;

        vscode.workspace
          .getConfiguration('fictionWriter.writingMode')
          .update('fontSize', parseInt(newSize), vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(`Writing Mode font size set to: ${newSize}`);
      });
  }

  setCurrentThemeAsFullscreenTheme() {
    const theme = this.configService.backup('workbench', 'colorTheme');
    this._setFullscreenTheme(theme);
  }

  selectFullscreenTheme() {
    const themes = this._getAllThemes().map(t => ({
      label: t,
      description: t,
      alwaysShow: true,
    }));

    const currentTheme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');

    let selectThemeTimeout: any | undefined;

    const selectTheme = (theme?: string, applyTheme?: boolean) => {
      if (selectThemeTimeout) {
        clearTimeout(selectThemeTimeout);
      }
      if (theme) {
        selectThemeTimeout = setTimeout(
          () => {
            selectThemeTimeout = undefined;
            vscode.workspace.getConfiguration('workbench').update('colorTheme', theme);
          },
          applyTheme ? 0 : 200
        );
      }
    };

    const autoFocusIndex = themes.findIndex(
      p => p.label === this.configService.getState().viewZenModeTheme
    );
    const quickpick = vscode.window.createQuickPick<vscode.QuickPickItem>();
    quickpick.items = themes;
    quickpick.placeholder = 'Select Color Theme (Up/Down Keys to Preview)';
    quickpick.activeItems = [themes[autoFocusIndex] as QuickPickItem];
    quickpick.canSelectMany = false;
    quickpick.onDidAccept(_ => {
      const theme = quickpick.activeItems[0];
      if (theme && theme.label) {
        this._setFullscreenTheme(theme.label);
      }
      quickpick.hide();
    });
    quickpick.onDidChangeActive(themes => selectTheme(themes[0].label, false));
    quickpick.onDidHide(() => {
      selectTheme(currentTheme, true);
    });
    quickpick.show();
  }

  private _setFullscreenTheme(theme?: string) {
    if (!theme) return;

    vscode.workspace
      .getConfiguration('fictionWriter.writingMode')
      .update('theme', theme, vscode.ConfigurationTarget.Global);

    vscode.window.showInformationMessage(`Writing Mode theme set to: ${theme}`);
  }

  private _getAllThemes(): string[] {
    const themes: string[] = [];

    vscode.extensions.all.forEach(ext => {
      const contributesThemes = ext.packageJSON.contributes?.themes;

      if (contributesThemes) {
        contributesThemes.forEach((theme: { id?: string; label?: string }) => {
          const id = theme.id ?? theme.label;
          if (id) themes.push(id);
        });
      }
    });

    return themes;
  }
}

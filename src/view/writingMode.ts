import * as vscode from 'vscode';
import { ConfigService } from "../config";

export class WritingMode {
    constructor(private configService: ConfigService) {
    }

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
            if (prevConfig)
                this.configService.setFlag('previousFocusMode');
            else
                this.configService.unsetFlag('previousFocusMode');

            this.configService.setLocal<boolean>('isFocusMode', true);
        }

        this.configService.setLocal('isZenMode', true);
    }

    async toggleWritingMode(toggleZenMode?: boolean) {
        if (!this.configService.getFlag('isAgreeZenMode')) {
            const option = await vscode.window.showWarningMessage(
                'Writing overrides some editor settings.\n\n' +
                'It can be that some settings would need to be restored manually. Make sure  you turn WritingMode off before deactivating/uninstalling this extension.',
                'OK, Continue', 'Cancel', 'Read More');

            if (option === 'OK, Continue') {
                this.configService.setFlag('isAgreeZenMode');
            } if (option === 'Read More') {
                vscode.env.openExternal(vscode.Uri.parse('https://zoctarine.github.io/vscode-fiction-writer/view/#writing-mode'));
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
        vscode.window.showInputBox({
            prompt: 'Writing Mode font size:',
            value: currentSizeSetting,
            validateInput: (input) => {
                const value = parseInt(input);
                if (value >= 5 && value <= 100) return null;
                return 'Value must be a number, greater than 0';
            }
        }).then(newSize => {
            if (!newSize) return;

            vscode.workspace
                .getConfiguration('markdown-fiction-writer.writingMode')
                .update('fontSize', parseInt(newSize), vscode.ConfigurationTarget.Global);

            vscode.window
                .showInformationMessage(`Writing Mode font size set to: ${newSize}`);
        });

    }


    setCurrentThemeAsFullscreenTheme() {
        const theme = this.configService.backup('workbench', 'colorTheme');
        this._setFullscreenTheme(theme);
    }

    selectFullscreenTheme() {
        const themes = this._getAllThemes();

        vscode.window
            .showQuickPick(themes)
            .then(theme => {
                this._setFullscreenTheme(theme);
            });
    }

    private _setFullscreenTheme(theme?: string) {
        if (!theme) return;

        vscode.workspace
            .getConfiguration('markdown-fiction-writer.writingMode')
            .update('theme', theme, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(`Writing Mode theme set to: ${theme}`);
    }

    private _getAllThemes(): string[] {
        const themes: string[] = [];

        vscode.extensions.all.forEach(ext => {
            const contributesThemes = ext.packageJSON.contributes?.themes;

            if (contributesThemes) {
                contributesThemes.forEach((theme: { id?: string, label?: string }) => {
                    const id = theme.id ?? theme.label;
                    if (id) themes.push(id);
                });
            };
        });

        return themes;
    }
}

import * as vscode from 'vscode';
import { ConfigurationTarget } from 'vscode';

export async function newMdFile(content: string): Promise<vscode.TextDocument> {
    const document = await vscode.workspace.openTextDocument({language: 'markdown', content });
    vscode.window.showTextDocument(document);
    return document;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
    }

export async function changeConfig(settings: any) {
    const config = vscode.workspace.getConfiguration();
    await config.update("fictionWriter", settings, ConfigurationTarget.Global);
}

export async function clearConfig() {
    await changeConfig(
        {
            rules: []
        }
    );
}
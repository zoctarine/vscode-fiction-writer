import { commands, Position, Selection, window, workspace, WorkspaceEdit } from 'vscode';
import { Config } from '../config';
import { IObservable, getActiveEditor, StringUtils } from '../utils';
import { EnhancedEditBehaviour } from "./enhancedEditBehaviour";

export class EnhancedEditDialogueBehaviour extends EnhancedEditBehaviour {
    constructor(config: IObservable<Config>) {
        super(config);
    }

    protected onNewLine() {
        let editor = getActiveEditor();
        if (!editor) return;

        let selection: Selection = editor.selection;
        let cursorPos: Position = editor.selection.active;
        let line = editor.document.lineAt(cursorPos.line);

        // if is empty dialogue indent, remove it
        if (line.text === this.state.dialgoueIndent ||
            line.text === this.state.dialoguePrefix ||
            StringUtils.isEmptyOrWhiteSpaces(line.text)) {

            return editor.edit(editBuilder => {
                editBuilder.delete(line.range);
                editBuilder.insert(line.range.end, '\n');
            }).then(() => {
                editor?.revealRange(editor.selection);
            });
        }

        // if it is a dialogue, add indent.
        if (line.text.startsWith(this.state.dialgoueIndent) ||
            line.text.startsWith(this.state.dialoguePrefix)) {

            return editor.edit(editBuilder => {
                editBuilder.insert(cursorPos, '\n' + this.state.dialgoueIndent);
                editBuilder.delete(selection);
            }).then(() => {
                editor?.revealRange(editor.selection);
            });
        }
        // else normal enter
        return super.onNewLine();
    }

    protected onNewParagraph() {
        const editor = getActiveEditor();
        if (!editor) return;

        let selection: Selection = editor.selection;
        let cursorPos: Position = editor.selection.active;
        let line = editor.document.lineAt(cursorPos.line);

        // if is empty dialogue indent, remove it
        if (line.text === this.state.dialgoueIndent ||
            line.text === this.state.dialoguePrefix ||
            StringUtils.isEmptyOrWhiteSpaces(line.text)) {

            return editor.edit(editBuilder => {
                editBuilder.delete(line.range);
                editBuilder.insert(line.range.end, '\n');
            }).then(() => {
                editor?.revealRange(editor.selection);
            });
        }

        if (line.text.startsWith(this.state.dialoguePrefix) ||
            line.text.startsWith(this.state.dialgoueIndent)) {
            return editor.edit(editBuilder => {
                editBuilder.insert(cursorPos, '\n\n' + this.state.dialoguePrefix);
                editBuilder.delete(selection);
            });
        }

        return editor.edit(editBuilder => {
            editBuilder.insert(cursorPos, '\n\n');
            editBuilder.delete(selection);
        }).then(() => {
            editor?.revealRange(editor.selection);
        });
    }
    onTabKey() {
        const editor = getActiveEditor();
        if (!editor) return;

        let selection: Selection = editor.selection;
        let cursorPos: Position = editor.selection.active;

        if (selection.isSingleLine && cursorPos.character === 0) {
            return editor.edit(editBuilder => {
                editBuilder.insert(cursorPos, this.state.dialgoueIndent);
            });
        }

        if (!selection.isSingleLine) {
            try {
                const selection = editor.selection;
                let edit = new WorkspaceEdit();
                for (let i = selection.start.line; i <= selection.end.line; i++) {
                    if (i === selection.end.line && !selection.isEmpty && selection.end.character === 0) {
                        break;
                    }
                    if (editor.document.lineAt(i).text.length !== 0) {
                        edit.insert(editor.document.uri, new Position(i, 0), this.state.dialgoueIndent);
                    }
                }
                return workspace.applyEdit(edit);
            } catch (error) {
                return commands.executeCommand('editor.action.indentLines');
            }
        }

        return super.onTabKey();
    }
    onBackspaceKey(): any {
        const editor = getActiveEditor();
        if (!editor) return;

        let cursorPos: Position = editor.selection.active;
        let line = editor.document.lineAt(cursorPos.line);

        if (line.text === this.state.dialoguePrefix ||
            line.text === this.state.dialgoueIndent) {

            return editor.edit(editBuilder => {
                editBuilder.delete(line.range);
            });
        }

        return super.onBackspaceKey();
    }
}

import { DecorationRangeBehavior, ExtensionContext, Position, Range, TextDocument, TextEditor, TextEditorDecorationType, window, workspace } from 'vscode';
import * as vscode from 'vscode';

const tokenTypes = ['comment'];
const legend = new vscode.SemanticTokensLegend(tokenTypes);

const provider: vscode.DocumentSemanticTokensProvider = {
  provideDocumentSemanticTokens(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.SemanticTokens> {

    const tokensBuilder = new vscode.SemanticTokensBuilder(legend);

    const regex = /(")([\s\S]*?)(")/igu;
    const text = document.getText();
    let match;
    let positions = [];
    let ind = 0;
    while ((match = regex.exec(text)) !== null) {
        let range = new Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));
        if (range.isSingleLine){
            tokensBuilder.push(range, 'comment');
        } else {
            let startLine = document.lineAt(range.start.line);
            let endLine = document.lineAt(range.end.line);
            tokensBuilder.push(new Range(range.start, startLine.range.end), 'comment');
            tokensBuilder.push(new Range(endLine.range.start, range.end), 'comment');
            for (let line = range.start.line+1; line<range.end.line; line++){
                tokensBuilder.push(document.lineAt(line).range, 'comment');
            }
        }
        ind++;
    };
    console.log(ind);
    return tokensBuilder.build();
  }
};

const selector = { language: 'markdown', scheme: 'file' };

vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, legend);

// const decorations: Map<string, TextEditorDecorationType> = new Map<string, TextEditorDecorationType>([
//     ['dialogueMarker', window.createTextEditorDecorationType({
//         'dark': { 'color': '#FF0000' },
//         'light': { 'color': '000000' },
//         'rangeBehavior': DecorationRangeBehavior.ClosedClosed
//     })],
//     ['dialogueContent', window.createTextEditorDecorationType({
//         'dark': { 'color': '#EEFFFF' },
//         'light': { 'color': '000000' }
//     })],
//     ['includeSymbol', window.createTextEditorDecorationType({
//         'dark': { 'color': '#EEFFFF' },
//         'light': { 'color': '000000' }
//     })],
//     ['includeContent', window.createTextEditorDecorationType({
//         'dark': { 'color': '#EEFFFF' },
//         'light': { 'color': '000000' }
//     })],
// ]);

// class Decorations {
//     activeDecorations: Map<string, Range[]> = new Map<string, Range[]>();

//     clearDecorations() {
//         this.activeDecorations.forEach((val, key, map) => map.set(key, []));
//     }

//     isValid(editor?: TextEditor) {
//         return editor && editor.document && editor.document.languageId === 'markdown';
//     }

//     getDocRange(match: any, doc: TextDocument): Range {
//         return new Range(doc.positionAt(match.index), doc.positionAt(match.index + match[0].length));
//     }

//     addDecoration(key: string, range: Range) {
//         var dec = this.activeDecorations.get(key) || [];
//         dec.push(range);
//         this.activeDecorations.set(key, dec);
//     }

//     updateDecorations(editor?: TextEditor) {
//         if (editor === undefined || !this.isValid(editor)) { return; }

//         const doc = editor.document;

//         this.clearDecorations();

//         const regex = /(")(.*?)(")/igu;

//         doc.getText().split(RegEx.NEWLINE).forEach((line, index) => {
//             let match;
//             while ((match = regex.exec(line)) !== null) {
//                 this.addDecoration('dialogueMarker', new Range(new Position(index, match.index), new Position(index, match.index + match[0].length+1)));
//             };
//         });
//         this.activeDecorations.forEach((value, key) => {
//             const dec = decorations.get(key);
//             if (dec !== undefined) {
//                 editor.setDecorations(dec, value);
//             }
//         });
//     }
// }

// // workspace.onDidChangeConfiguration(event => {
// //     if (event.affectsConfiguration('markdown.extension.syntax.decorations')) {
// //         window.showInformationMessage('Please reload VSCode to make setting `syntax.decorations` take effect.')
// //     }
// // });

// // if (!workspace.getConfiguration('markdown.extension.syntax').get<boolean>('decorations')) return;
// export const dec = new Decorations();

// window.onDidChangeActiveTextEditor(e => dec.updateDecorations(e));

// workspace.onDidChangeTextDocument(event => {
//     let editor = window.activeTextEditor;
//     if (editor !== undefined && event.document === editor.document) {
//         triggerUpdateDecorations(editor);
//     }
// });

// let timeout: NodeJS.Timeout | null = null;
// function triggerUpdateDecorations(editor: TextEditor) {
//     if (timeout) {
//         clearTimeout(timeout);
//     }
//     timeout = setTimeout(() => dec.updateDecorations(editor), 200);
// }
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as utils from './testUtils';

suite('Document Formatting', () => {
  test('Should start activate @fiction-writer when opening markdown document', async () => {
    await utils.newMdFile('# markdown heading');
    await utils.sleep(1000);

    const started = vscode.extensions.getExtension('vsc-zoctarine.markdown-fiction-writer');
    assert.notStrictEqual(started, undefined);
    assert.strictEqual(started?.isActive, true);
  });

  test('Format Enabled', () => {
    var document = vscode.workspace.openTextDocument();
    debugger;
    vscode.window.activeTextEditor?.edit(editBuilder => {
      editBuilder.insert(new vscode.Position(0, 0), 'Something');
    });
  });
});

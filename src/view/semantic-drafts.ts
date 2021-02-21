import * as vscode from 'vscode';

const tokenTypes = new Map<string, number>();
const legend = (function () {
	const tokenTypesLegend = [
		'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
		'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
		'method', 'macro', 'variable', 'parameter', 'property', 'label'
	];
	tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));
	return new vscode.SemanticTokensLegend(tokenTypesLegend);
})();
let called = 0;

function _encodeTokenType(tokenType: string): number {
  if (tokenTypes.has(tokenType)) {
    return tokenTypes.get(tokenType)!;
  } else if (tokenType === 'notInLegend') {
    return tokenTypes.size + 2;
  }
  return 0;
}


// TODO: Uncomment this to load
//vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, legend);

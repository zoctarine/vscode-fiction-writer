(function () {
  const vscode = acquireVsCodeApi();

  window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent
    const txt = document.getElementById('fw-txt-notes');
    switch (message.type) {
      case 'submitNotes':
        vscode.postMessage({
          type: 'saveNotes',
          value: txt.value
        });
        break;
    }
  });
})();
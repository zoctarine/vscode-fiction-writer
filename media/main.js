(function () {
  const vscode = acquireVsCodeApi();
  const txt = document.getElementById('fw-txt-notes');
  if (txt) {
    let timeout;
    txt.addEventListener('input', event => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (event?.target?.value) {
          vscode.postMessage({
            type: 'changed',
            value: txt.value
          });
        }
      }, 500);
    });


    window.addEventListener('message', event => {
      const message = event.data; // The JSON data our extension sent
      if (!txt) return;
      switch (message.type) {
        case 'submitNotes':
          if (timeout) clearTimeout(timeout);
          vscode.postMessage({
            type: 'saveNotes',
            value: txt.value
          });
          break;
      }
    });
  }

  const button = document.getElementById('fw-txt-add-note');
  if (button) {
    button.addEventListener('click', event => {
          vscode.postMessage({
            type: 'newNote'
          });
    });
  }
})();
import { commands } from 'vscode';
import { Config } from '../config';
import { Observer } from '../utils';

export class EnhancedEditBehaviour extends Observer<Config> {

    onEnterKey(): any {
        return this.state.inverseEnter
            ? this.onNewParagraph()
            : this.onNewLine();
    }

    onShiftEnterKey(): any {
        return this.state.inverseEnter
            ? this.onNewLine()
            : this.onNewParagraph();
    }

    onBackspaceKey(): any {
        return commands.executeCommand('deleteLeft');
    }

    onDeleteKey(): any {
        return commands.executeCommand('deleteRight');
    }

    onTabKey(): any {
        return commands.executeCommand('tab');
    }
    
    protected onNewLine(): any {
        return commands.executeCommand('type', { source: 'keyboard', text: '\n' });
    }

    protected onNewParagraph(): any {
        return commands.executeCommand('type', { source: 'keyboard', text: '\n\n' });
    }
}

import * as vscode from 'vscode';

/**
 * This function gets called when the extension is activated.
 * 
 * @param context - Context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    const api = gitExtension?.getAPI(1);

    if (!api) {
        vscode.window.showErrorMessage("Git API not found!");
        return;
    }

    const handleBranchChange = (repo: any) => {
        const head = repo.state.HEAD;

        if (head) {
            const { name } = head;
            vscode.window.showInformationMessage(`Switched to branch: ${name}`);
        } else {
            vscode.window.showInformationMessage("No branch is currently checked out.");
        }
    };

    const attachListeners = (repo: any) => {
        context.subscriptions.push(
            repo.state.onDidChange(() => handleBranchChange(repo))
        );
    };

    api.repositories.forEach((repo: any) => attachListeners(repo));

    context.subscriptions.push(
        api.onDidOpenRepository((repo: any) => attachListeners(repo))
    );

    api.repositories.forEach(handleBranchChange);
}

/**
 * This function is called when the extension is deactivated.
 */
export function deactivate() {}

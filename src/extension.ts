import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('git-tab-tracker.getCurrentBranch', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if(!workspaceFolders){
			vscode.window.showErrorMessage('No workspace is open.');
            return;
		}

		const git: SimpleGit = simpleGit(workspaceFolders[0].uri.fsPath);
        try {
            const branchSummary = await git.branch();
            const currentBranch = branchSummary.current;
            vscode.window.showInformationMessage(`Current branch: ${currentBranch}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to get current branch: ');
        }
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
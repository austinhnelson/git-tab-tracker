import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';

/**
 * This function gets called when the extension is activated.
 * It registers the command as 'git-tab-tracker.getCurrentBranch'.
 * 
 * @param context - Context provided by VS Code.
 */
export async function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('git-tab-tracker.getCurrentBranch', async () => {
		await trackTabs();
	});

	context.subscriptions.push(disposable);
}

/**
 * This function is called when the extension is deactivated.
 */
export function deactivate() {}

async function trackTabs() {
	let workspacePath = await getWorkspaceFolder();
	if (!workspacePath) {
		return;
	}

	getGitBranch(workspacePath);
}

async function getWorkspaceFolder(): Promise<string | undefined>{
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if(!workspaceFolders){
		vscode.window.showErrorMessage('No workspace open!');
		return;
	}

	return workspaceFolders[0].uri.fsPath;
}

async function getGitBranch(folderPath: string) {
	const git: SimpleGit = simpleGit(folderPath);
	try {
		const branchSummary = await git.branch();
		const currentBranch = branchSummary.current;
		vscode.window.showInformationMessage(`Current branch: ${currentBranch}`);
	} catch (error) {
		vscode.window.showErrorMessage('Failed to get current branch: ');
	}
}
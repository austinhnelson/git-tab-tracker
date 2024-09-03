import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';

/**
 * This function gets called when the extension is activated.
 * It registers the command as 'git-tab-tracker.getCurrentBranch'.
 * 
 * @param context - Context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('git-tab-tracker.getCurrentBranch', async () => {
		trackTabs();
	});

	context.subscriptions.push(disposable);
}

/**
 * Tracks the currently open tabs in the editor and
 * associates them with a git branch.
 */
async function trackTabs() {
	let workspacePath = await getWorkspaceFolder();
	if (!workspacePath) {
		return;
	}

	getGitBranch(workspacePath);
}

/**
 * Gets the current path of the open folder in VS Code.
 * 
 * @returns {Promise<string | undefined>} The path to the first workspace folder, or undefined if none is open.
 */
async function getWorkspaceFolder(): Promise<string | undefined>{
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if(!workspaceFolders){
		vscode.window.showErrorMessage('No workspace open!');
		return;
	}

	return workspaceFolders[0].uri.fsPath;
}

/**
 * Gets the current git branch checked out in the project.
 * 
 * @param folderPath - The path to the folder where the Git repository is located.
 */
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

/**
 * This function is called when the extension is deactivated.
 */
export function deactivate() {}
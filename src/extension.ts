import * as vscode from "vscode";

/**
 * This function gets called when the extension is activated.
 *
 * @param context - Context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
  const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports;
  const api = gitExtension?.getAPI(1);

  if (!api) {
    vscode.window.showErrorMessage("Git API not found!");
    return;
  }

  let currentBranch: string | undefined;

  const trackTabs = async (repo: any) => {
    const head = repo.state.HEAD;

    if (head) {
      const newBranch = head.name;

      if (currentBranch && currentBranch !== newBranch) {
        await persistTabs(context, currentBranch);
        await openTabs(context, newBranch);
      }

      currentBranch = newBranch;
    }
  };

  const attachListeners = (repo: any) => {
    context.subscriptions.push(repo.state.onDidChange(() => trackTabs(repo)));
  };

  api.repositories.forEach((repo: any) => {
    const head = repo.state.head;
    currentBranch = head?.name;

    attachListeners(repo);
  });

  context.subscriptions.push(api.onDidOpenRepository(attachListeners));
}

/**
 * This function is called when the extension is deactivated.
 */
export function deactivate() {}

async function persistTabs(context: vscode.ExtensionContext, branch: string) {
  const openTabs = vscode.window.tabGroups.all
    .flatMap((group) => group.tabs)
    .filter((tab) => tab.input && (tab.input as any).uri)
    .map((tab) => (tab.input as any).uri.toString());

  const branchTabs: Record<string, string[]> = context.workspaceState.get(
    "branchTabs",
    {}
  );
  branchTabs[branch] = openTabs;

  await context.workspaceState.update("branchTabs", branchTabs);

  vscode.window.showInformationMessage(
    `Saved ${openTabs.length} tabs for branch: ${branch}`
  );
}

async function getPersistedTabs(
  context: vscode.ExtensionContext,
  branch: string
) {
  const branchTabs: Record<string, string[]> = context.workspaceState.get(
    "branchTabs",
    {}
  );
  const tabs = branchTabs[branch];

  if (!tabs) {
    return [];
  }

  return tabs;
}

async function openTabs(context: vscode.ExtensionContext, branch: string) {
  const tabs = await getPersistedTabs(context, branch);

  await vscode.commands.executeCommand("workbench.action.closeAllEditors");

  for (const tabUri of tabs) {
    const uri = vscode.Uri.parse(tabUri);
    try {
      await vscode.window.showTextDocument(uri, { preview: false });
    } catch (err) {
      vscode.window.showErrorMessage(`Could not open file: ${uri.fsPath}`);
    }
  }
}

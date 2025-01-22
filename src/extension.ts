import * as vscode from "vscode";
import i18next from "i18next";

i18next.init({
  lng: "en",
  debug: true,
  resources: {
    en: {
      translation: {
        yes: "Yes",
        no: "No",
        error: {
          apiNotFound: "Git API not found.",
        },
        information: {
          noSavedTabs:
            "No saved tabs for the branch checked out, bring tabs with you? This setting can be configured in settings.",
        },
      },
    },
  },
});

/**
 * This function gets called when the extension is activated.
 *
 * @param context - Context provided by VS Code.
 */
export const activate = (context: vscode.ExtensionContext) => {
  const gitApi = getApi();

  if (!gitApi) {
    vscode.window.showErrorMessage(i18next.t("error.apiNotFound"));
    return;
  }

  const attachListeners = (repo: any) => {
    context.subscriptions.push(
      repo.state.onDidChange(async () => await trackTabs(repo))
    );

    context.subscriptions.push(
      repo.state.onDidChange(async () => await deleteBranch(repo))
    );
  };

  const deleteBranch = async (repo: any) => {
    await vscode.window.showInformationMessage("test");
  };

  const trackTabs = async (repo: any) => {
    const newBranch = repo.state.HEAD.name;

    if (newBranch) {
      if (currentBranch && currentBranch !== newBranch) {
        await persistTabs(context, currentBranch);

        const config = vscode.workspace.getConfiguration("tabTracker");

        let shouldBringTabs = config.get<boolean>(
          "bringOpenTabsWhenNoSavedAssociations"
        );
        const tabs = await getPersistedTabs(context, newBranch);

        if (tabs.length === 0) {
          const shouldShowInfoBox = config.get<boolean>(
            "displayInfoBoxWhenNoSavedAssociations"
          );

          if (shouldShowInfoBox) {
            const selection = await vscode.window.showInformationMessage(
              i18next.t("information.noSavedTabs"),
              i18next.t("yes"),
              i18next.t("no")
            );

            if (selection === "Yes") {
              shouldBringTabs = true;
            } else if (selection === "No") {
              shouldBringTabs = false;
            }
          }

          if (shouldBringTabs) {
            await openTabs(context, newBranch);
          } else {
            await vscode.commands.executeCommand(
              "workbench.action.closeAllEditors"
            );
          }
        } else {
          await openTabs(context, newBranch);
        }
      }

      currentBranch = newBranch;
    }
  };

  let currentBranch: string | undefined;

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const repo = workspaceFolder
    ? gitApi.getRepository(workspaceFolder.uri)
    : undefined;

  if (repo) {
    attachListeners(repo);
    currentBranch = repo.state.head?.name;
  }

  context.subscriptions.push(
    gitApi.onDidOpenRepository((newRepo: any) => {
      if (newRepo.rootUri.fsPath === workspaceFolder?.uri.fsPath) {
        attachListeners(newRepo);
      }
    })
  );
};

/**
 * This function is called when the extension is deactivated.
 */
export const deactivate = () => {};

const getApi = () => {
  const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports;
  return gitExtension?.getAPI(1) || null;
};

const persistTabs = async (
  context: vscode.ExtensionContext,
  branch: string
) => {
  const openTabs = vscode.window.tabGroups.all.flatMap((group, groupIndex) =>
    group.tabs.map((tab) => ({
      uri: (tab.input as any).uri.toString(),
      groupIndex,
    }))
  );

  const branchTabs: Record<string, any[]> = context.workspaceState.get(
    "branchTabs",
    {}
  );

  branchTabs[branch] = openTabs;

  await context.workspaceState.update("branchTabs", branchTabs);
};

const openTabs = async (context: vscode.ExtensionContext, branch: string) => {
  const tabs = await getPersistedTabs(context, branch);

  if (!tabs || tabs.length === 0) {
    return;
  }
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");

  for (const tab of tabs) {
    if (!tab.uri) {
      continue;
    }

    const uri = vscode.Uri.parse(tab.uri);

    try {
      await vscode.window.showTextDocument(uri, {
        preview: false,
        viewColumn: tab.groupIndex + 1,
      });
    } catch (err) {
      vscode.window.showErrorMessage(`Could not open file: ${uri.fsPath}`);
    }
  }
};

const getPersistedTabs = async (
  context: vscode.ExtensionContext,
  branch: string
) => {
  const branchTabs: Record<string, any[]> = context.workspaceState.get(
    "branchTabs",
    {}
  );

  return branchTabs[branch] || [];
};

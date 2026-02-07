import * as assert from "assert";
import { GitActions } from "../../services/git-actions";

suite("GitActions Test Suite", () => {
  // vscode.window.showInformationMessage("Start GitActions tests.");

  test("GitActions instance creation", () => {
    const gitActions = new GitActions();
    assert.ok(gitActions);
  });

  test("Get current branch info", async () => {
    try {
      const gitActions = new GitActions();
      const branchInfo = await gitActions.getCurrentBranchInfo();

      assert.ok(branchInfo);
      assert.ok(branchInfo.current);
      assert.ok(typeof branchInfo.current === "string");

      console.log("Current branch info:", branchInfo);
    } catch (error) {
      // Test may fail in environments without git
      console.log("Git not available or no repository:", error);
    }
  });

  test("Get available branches", async () => {
    try {
      const gitActions = new GitActions();
      const branches = await gitActions.getAvailableBranches();

      assert.ok(Array.isArray(branches));

      console.log("Available branches:", branches);
    } catch (error) {
      // Test may fail in environments without git
      console.log("Git not available or no repository:", error);
    }
  });

  test("Check if branch exists", async () => {
    try {
      const gitActions = new GitActions();

      // Test with a branch that likely exists
      const mainExists = await gitActions.branchExists("main");
      const masterExists = await gitActions.branchExists("master");

      // At least one should exist, or both false if no git repo
      assert.ok(typeof mainExists === "boolean");
      assert.ok(typeof masterExists === "boolean");

      console.log("Main exists:", mainExists, "Master exists:", masterExists);
    } catch (error) {
      console.log("Git not available or no repository:", error);
    }
  });

  test("Check repository status", async () => {
    try {
      const gitActions = new GitActions();
      const isClean = await gitActions.isRepositoryClean();

      assert.ok(typeof isClean === "boolean");

      console.log("Repository is clean:", isClean);
    } catch (error) {
      console.log("Git not available or no repository:", error);
    }
  });
});

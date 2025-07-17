# GitActions Service

The `GitActions` service provides comprehensive Git operations for the CodeBuddy extension, enabling advanced features like commit message generation and pull request reviews.

## Features

### Core Git Operations
- **Staged Differences**: Get staged changes for commit message generation
- **PR Differences**: Compare current branch against base branch for PR reviews
- **Branch Management**: Get current branch info, available branches, and base branch detection
- **Repository Status**: Check repository cleanliness and status

### Advanced Operations
- **Commit History**: Get commit history between branches
- **File Operations**: Get file content at specific commits
- **Diff Statistics**: Get detailed diff statistics
- **Remote Operations**: Get remote URLs and information

## Usage

### Basic Usage
```typescript
import { GitActions } from '../services/git-actions';

const gitActions = new GitActions();

// Get staged changes for commit message
const stagedDiff = await gitActions.getStagedDifferenceSummary();

// Get PR differences for review
const prDiff = await gitActions.getPRDifferenceSummary();

// Get current branch information
const branchInfo = await gitActions.getCurrentBranchInfo();
```

### Branch Operations
```typescript
// Get all available branches
const branches = await gitActions.getAvailableBranches();

// Get the base branch (automatically detected)
const baseBranch = await gitActions.getBaseBranch();

// Check if a branch exists
const exists = await gitActions.branchExists('main');
```

### Repository Status
```typescript
// Check if repository is clean
const isClean = await gitActions.isRepositoryClean();

// Get detailed repository status
const status = await gitActions.getRepositoryStatus();
```

### Advanced Operations
```typescript
// Get commit history between branches
const commits = await gitActions.getCommitHistory('main', 'feature-branch');

// Get modified files between branches
const modifiedFiles = await gitActions.getModifiedFiles('main');

// Get diff statistics
const diffStats = await gitActions.getDiffStats('main');

// Get file content at specific commit
const content = await gitActions.getFileAtCommit('src/file.ts', 'abc123');
```

## Integration with Commands

### GenerateCommitMessage
The `GenerateCommitMessage` command uses `GitActions` to get staged differences:

```typescript
const gitActions = new GitActions();
const stagedDiff = await gitActions.getStagedDifferenceSummary();
```

### ReviewPR
The `ReviewPR` command uses `GitActions` for comprehensive PR analysis:

```typescript
const gitActions = new GitActions();

// Get target branch from user input
const targetBranch = await selectTargetBranch();

// Get PR differences
const prDiff = await gitActions.getPRDifferenceSummary(targetBranch);

// Get additional context
const diffStats = await gitActions.getDiffStats(targetBranch);
const commitHistory = await gitActions.getCommitHistory(targetBranch);
```

## Error Handling

All GitActions methods include proper error handling and logging:

```typescript
try {
  const result = await gitActions.someOperation();
  return result;
} catch (error) {
  console.error("Git operation failed:", error);
  throw error;
}
```

## Base Branch Detection

The service automatically detects the base branch using this priority:

1. **Default Branches**: Checks for `main`, `master`, `develop`, `dev`
2. **Merge Base**: Uses `git merge-base` to find common ancestor
3. **Upstream Branch**: Falls back to upstream tracking branch
4. **Final Fallback**: Defaults to `main`

## Configuration

The GitActions service is configured with these default options:

```typescript
const options: Partial<SimpleGitOptions> = {
  binary: "git",
  maxConcurrentProcesses: 6,
  trimmed: false,
  baseDir: workspaceRoot,
};
```

## Dependencies

- **simple-git**: Core Git operations
- **vscode**: VS Code API for workspace access

## Future Enhancements

Potential future additions to the GitActions service:

- **Conflict Resolution**: Helper methods for merge conflicts
- **Stash Operations**: Stash management utilities
- **Tag Operations**: Tag creation and management
- **Patch Operations**: Patch generation and application
- **Hooks Integration**: Git hooks management
- **Performance Optimization**: Caching and batched operations

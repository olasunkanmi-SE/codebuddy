---
name: github
description: Manage GitHub repositories, issues, and pull requests via the gh CLI.
---

# gh (GitHub CLI)

Use `./.codebuddy/bin/gh` to interact with GitHub.
This tool allows you to manage PRs, issues, and repositories directly from the chat.

## Setup

Before using, you must authenticate. Run the following command in the terminal:
`./.codebuddy/bin/gh auth login`

## Common Commands

### Pull Requests
- List PRs: `./.codebuddy/bin/gh pr list`
- View PR: `./.codebuddy/bin/gh pr view <PR-NUMBER>`
- Checkout PR: `./.codebuddy/bin/gh pr checkout <PR-NUMBER>`
- Create PR: `./.codebuddy/bin/gh pr create`
- Review PR: `./.codebuddy/bin/gh pr review <PR-NUMBER>`
- Merge PR: `./.codebuddy/bin/gh pr merge <PR-NUMBER>`

### Issues
- List issues: `./.codebuddy/bin/gh issue list`
- View issue: `./.codebuddy/bin/gh issue view <ISSUE-NUMBER>`
- Create issue: `./.codebuddy/bin/gh issue create`

### Repositories
- View repo info: `./.codebuddy/bin/gh repo view`
- Clone repo: `./.codebuddy/bin/gh repo clone <OWNER>/<REPO>`

## Notes
- Ensure you have a GitHub account and permissions for the repositories you want to access.
- Authentication token is stored securely by `gh`.

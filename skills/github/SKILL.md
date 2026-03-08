---
name: github
description: Manage GitHub repositories, issues, and pull requests via the gh CLI.
metadata:
  displayName: GitHub
  icon: github
  category: version-control
  version: 1.0.0
  dependencies:
    cli: gh
    checkCommand: gh --version
    install:
      darwin:
        brew: gh
        scriptArch:
          x64: curl -fsSL https://github.com/cli/cli/releases/latest/download/gh_*_macOS_amd64.tar.gz | tar xz && sudo mv gh_*/bin/gh /usr/local/bin/
          arm64: curl -fsSL https://github.com/cli/cli/releases/latest/download/gh_*_macOS_arm64.tar.gz | tar xz && sudo mv gh_*/bin/gh /usr/local/bin/
        manual: Download from https://github.com/cli/cli/releases and add to PATH
      linux:
        apt: gh
        script: |
          type -p curl >/dev/null || sudo apt install curl -y
          curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
          echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
          sudo apt update && sudo apt install gh -y
      windows:
        winget: GitHub.cli
        scoop: gh
  auth:
    type: oauth
    setupCommand: gh auth login
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

---
name: gitlab
description: Manage GitLab issues and merge requests via the glab CLI.
metadata:
  displayName: GitLab
  icon: git-merge
  category: version-control
  version: 1.0.0
  dependencies:
    cli: glab
    checkCommand: glab --version
    bundledInstall: skills/gitlab/install.sh
    install:
      darwin:
        brew: glab
        scriptArch:
          x64: curl -fsSL https://gitlab.com/gitlab-org/cli/-/releases/permalink/latest/downloads/glab_*_macOS_x86_64.tar.gz | tar xz && sudo mv bin/glab /usr/local/bin/
          arm64: curl -fsSL https://gitlab.com/gitlab-org/cli/-/releases/permalink/latest/downloads/glab_*_macOS_arm64.tar.gz | tar xz && sudo mv bin/glab /usr/local/bin/
        manual: Download from https://gitlab.com/gitlab-org/cli/-/releases
      linux:
        apt: glab
        dnf: glab
        snap: glab
        script: curl -fsSL https://gitlab.com/gitlab-org/cli/-/releases/permalink/latest/downloads/glab_*_Linux_x86_64.tar.gz | tar xz && sudo mv bin/glab /usr/local/bin/
      windows:
        scoop: glab
        choco: glab
        winget: GLab.GLab
  config:
    - name: GITLAB_HOST
      label: GitLab Host
      type: string
      required: false
      placeholder: https://gitlab.com
  auth:
    type: oauth
    setupCommand: glab auth login
---

# glab

Use `glab` to interact with GitLab.
This tool allows you to view, create, and update GitLab issues and merge requests.

## Setup

Ensure `glab` is installed and authenticated.
If using the bundled version, run:
`./.codebuddy/bin/glab auth login`

## Common Commands

### Issues

- List issues: `glab issue list`
- View issue: `glab issue view <ID>`
- Create issue: `glab issue create`
- Assign: `glab issue update <ID> --assignee <USER>`

### Merge Requests

- List MRs: `glab mr list`
- Create MR: `glab mr create`
- View MR: `glab mr view <ID>`

## Notes

- Requires a GitLab personal access token.

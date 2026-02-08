---
name: gitlab
description: Manage GitLab issues and merge requests via the glab CLI.
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

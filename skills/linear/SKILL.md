---
name: linear
description: Manage Linear issues via the linear-cli (unofficial or custom wrapper).
metadata:
  displayName: Linear
  icon: list
  category: project-management
  version: 1.0.0
  dependencies:
    cli: linear
    checkCommand: linear --version
    install:
      darwin:
        npm: "@linear/cli"
      linux:
        npm: "@linear/cli"
      windows:
        npm: "@linear/cli"
  config:
    - name: LINEAR_API_KEY
      label: API Key
      type: secret
      required: true
    - name: LINEAR_TEAM_ID
      label: Team ID
      type: string
      required: false
      placeholder: your-team-id
  auth:
    type: api-key
---

# linear-cli

Use `linear` (or appropriate CLI wrapper) to interact with Linear.

## Common Commands

### Issues

- List issues: `linear issue list`
- View issue: `linear issue view <ID>`
- Create issue: `linear issue create`

## Notes

- Requires a Linear CLI tool to be installed.
- Requires `LINEAR_API_KEY` environment variable.

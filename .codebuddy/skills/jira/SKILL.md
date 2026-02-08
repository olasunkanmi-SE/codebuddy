---
name: jira
description: Manage Jira issues, sprints, and epics via the jira-cli tool.
---

# jira-cli

Use `./.codebuddy/bin/jira` to interact with Jira.
This tool allows you to view, create, and update Jira issues directly from the chat.

## Setup

Before using, you must authenticate. Run the following command in the terminal:
`./.codebuddy/bin/jira init`

## Common Commands

### Issues
- List issues: `./.codebuddy/bin/jira issue list`
- View issue: `./.codebuddy/bin/jira issue view <ISSUE-KEY>`
- Create issue: `./.codebuddy/bin/jira issue create`
- Comment: `./.codebuddy/bin/jira issue comment add <ISSUE-KEY> "Comment text"`
- Assign: `./.codebuddy/bin/jira issue assign <ISSUE-KEY> <USER>`

### Sprints & Boards
- List boards: `./.codebuddy/bin/jira board list`
- List sprints: `./.codebuddy/bin/jira sprint list --board <BOARD-ID>`

### JQL
- Search with JQL: `./.codebuddy/bin/jira issue list --jql "project = PROJ AND status = 'In Progress'"`

## Notes
- Ensure you have an API token ready from Atlassian (https://id.atlassian.com/manage-profile/security/api-tokens).
- Configuration is stored in `~/.jira/.config.yml`.

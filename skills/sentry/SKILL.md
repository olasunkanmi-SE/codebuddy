---
name: sentry
description: Manage Sentry projects and releases via the sentry-cli.
metadata:
  displayName: Sentry
  icon: alert-circle
  category: monitoring
  version: 1.0.0
  dependencies:
    cli: sentry-cli
    checkCommand: sentry-cli --version
    install:
      darwin:
        brew: getsentry/tools/sentry-cli
        script: curl -sL https://sentry.io/get-cli/ | bash
      linux:
        script: curl -sL https://sentry.io/get-cli/ | bash
      windows:
        scoop: sentry-cli
        npm: "@sentry/cli"
  config:
    - name: SENTRY_ORG
      label: Organization
      type: string
      required: true
      placeholder: your-org-slug
    - name: SENTRY_PROJECT
      label: Project
      type: string
      required: true
      placeholder: your-project-slug
    - name: SENTRY_AUTH_TOKEN
      label: Auth Token
      type: secret
      required: true
  auth:
    type: api-key
---

# sentry-cli

Use `sentry-cli` to interact with Sentry.

## Common Commands

### Releases

- List releases: `sentry-cli releases list`
- New release: `sentry-cli releases new <version>`
- Finalize release: `sentry-cli releases finalize <version>`

### Issues

- List issues: `sentry-cli issues list`

## Notes

- Requires `sentry-cli` to be installed.
- Requires `SENTRY_AUTH_TOKEN` and `SENTRY_ORG` environment variables or configuration.

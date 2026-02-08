---
name: sentry
description: Manage Sentry projects and releases via the sentry-cli.
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

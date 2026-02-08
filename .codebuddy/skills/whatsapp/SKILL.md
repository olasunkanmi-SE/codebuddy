---
name: whatsapp
description: Send WhatsApp messages to other people or search/sync WhatsApp history via the wacli CLI (not for normal user chats).
---

# wacli (WhatsApp CLI)

Use `./.codebuddy/bin/wacli --store ./.codebuddy/wacli_store` only when the user explicitly asks you to message someone else on WhatsApp or when they ask to sync/search WhatsApp history.
Do NOT use `./.codebuddy/bin/wacli` for normal user chats; OpenClaw routes WhatsApp conversations automatically.
If the user is chatting with you on WhatsApp, you should not reach for this tool unless they ask you to contact a third party.

## Auth + sync

- `./.codebuddy/bin/wacli auth --store ./.codebuddy/wacli_store` (QR login + initial sync)
- `./.codebuddy/bin/wacli sync --follow --store ./.codebuddy/wacli_store` (continuous sync)
- `./.codebuddy/bin/wacli doctor --store ./.codebuddy/wacli_store`

## Find chats + messages

- `./.codebuddy/bin/wacli chats list --store ./.codebuddy/wacli_store --limit 20 --query "name or number"`
- `./.codebuddy/bin/wacli messages search "query" --store ./.codebuddy/wacli_store --limit 20 --chat <jid>`
- `./.codebuddy/bin/wacli messages search "invoice" --store ./.codebuddy/wacli_store --after 2025-01-01 --before 2025-12-31`

## History backfill

- `./.codebuddy/bin/wacli history backfill --chat <jid> --store ./.codebuddy/wacli_store --requests 2 --count 50`

## Send

- Text: `./.codebuddy/bin/wacli send text --store ./.codebuddy/wacli_store --to "+14155551212" --message "Hello! Are you free at 3pm?"`
- Group: `./.codebuddy/bin/wacli send text --store ./.codebuddy/wacli_store --to "1234567890-123456789@g.us" --message "Running 5 min late."`
- File: `./.codebuddy/bin/wacli send file --store ./.codebuddy/wacli_store --to "+14155551212" --file /path/agenda.pdf --caption "Agenda"`

## Notes

- Store dir: `./.codebuddy/wacli_store` (override with `--store`).
- Use `--json` for machine-readable output when parsing.
- Backfill requires your phone online; results are best-effort.
- WhatsApp CLI is not needed for routine user chats; it’s for messaging other people.
- JIDs: direct chats look like `<number>@s.whatsapp.net`; groups look like `<id>@g.us` (use `./.codebuddy/bin/wacli chats list` to find).

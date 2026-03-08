---
name: email
description: Send emails using mailsend-go CLI
metadata:
  displayName: Email (SMTP)
  icon: mail
  category: communication
  version: 1.0.0
  dependencies:
    cli: mailsend
    checkCommand: mailsend -V
    install:
      darwin:
        brew: mailsend-go
        go: github.com/muquit/mailsend-go@latest
      linux:
        go: github.com/muquit/mailsend-go@latest
      windows:
        go: github.com/muquit/mailsend-go@latest
  config:
    - name: SMTP_HOST
      label: SMTP Host
      type: string
      required: false
      placeholder: smtp.gmail.com
    - name: SMTP_PORT
      label: SMTP Port
      type: string
      required: false
      placeholder: "587"
  auth:
    type: basic
---

# Email Skill

This skill allows sending emails via SMTP using the `mailsend` tool (mailsend-go).

## Prerequisites

- `mailsend` binary must be in `.codebuddy/bin/mailsend`
- SMTP credentials (host, port, user, password)

## Usage

Use `./.codebuddy/bin/mailsend` to send emails.

### Send a simple email

```bash
./.codebuddy/bin/mailsend -smtp <smtp_host> -port <smtp_port> -auth -user <username> -pass <password> -from <sender_email> -to <recipient_email> -sub "Subject" -body "Body text"
```

### Send with SSL/TLS (Gmail example)

```bash
./.codebuddy/bin/mailsend -smtp smtp.gmail.com -port 587 -starttls -auth -user <username> -pass <password> -from <sender_email> -to <recipient_email> -sub "Subject" -body "Body text"
```

### Notes

- For Gmail, use App Passwords if 2FA is enabled.
- Always ask the user for SMTP credentials before sending if not provided.

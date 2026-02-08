---
name: email
description: Send emails using mailsend-go CLI
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

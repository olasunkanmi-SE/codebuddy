---
name: gmail
description: Read, send, and manage Gmail emails via the gmail-cli tool.
metadata:
  displayName: Gmail
  icon: mail
  category: communication
  version: 1.0.0
  dependencies:
    cli: gmail-cli
    checkCommand: gmail-cli --version
    bundledInstall: skills/gmail/install.sh
    install:
      darwin:
        pip: gmail-cli
      linux:
        pip: gmail-cli
      windows:
        pip: gmail-cli
  config:
    - name: GMAIL_CREDENTIALS_PATH
      label: Credentials Path
      type: string
      required: false
      placeholder: ~/.gmail-cli/credentials.json
  auth:
    type: oauth
    setupCommand: gmail-cli auth
---

# gmail-cli

Use `./.codebuddy/bin/gmail-cli` to interact with Gmail.
This tool allows you to read, send, and manage Gmail messages directly from the chat.

## ⚠️ Security Warning

**CRITICAL**: This tool accesses your Gmail account. Follow security best practices:

- ✅ **ALWAYS** set file permissions: `chmod 700 ~/.gmail-cli && chmod 600 ~/.gmail-cli/*`
- ✅ **NEVER** commit `credentials.json` or `token.pickle` to git
- ✅ Use the secure installation script: `bash .codebuddy/skills/gmail/install.sh`
- ✅ Review `SECURITY.md` for comprehensive security guidance
- ⚠️ Extra caution on shared systems - other users may access your credentials if permissions are wrong!

## Setup

**Recommended**: Use the secure installation script:

```bash
cd .codebuddy/skills/gmail
bash install.sh
```

This script will:

- Create isolated Python virtual environment
- Install dependencies with security audit
- Set secure file permissions (700/600)
- Guide you through OAuth2 setup

**Manual Setup** (if needed):

Before using, you must authenticate with Google OAuth2. Run the following command in the terminal:

```bash
./.codebuddy/bin/gmail-cli auth
```

This will:

1. Open a browser window for Google OAuth2 authentication
2. Request permissions to access your Gmail account
3. Store credentials locally for future use

**Important**: You need to set up OAuth2 credentials first. See `SETUP.md` for detailed instructions.

## Common Commands

### Authentication

- Authenticate: `./.codebuddy/bin/gmail-cli auth`
- Reset authentication: `./.codebuddy/bin/gmail-cli auth --reset`

### Reading Emails

- List recent emails: `./.codebuddy/bin/gmail-cli list --max 10`
- List unread emails: `./.codebuddy/bin/gmail-cli list --unread`
- Search emails: `./.codebuddy/bin/gmail-cli list --query "subject:meeting"`
- Read specific email: `./.codebuddy/bin/gmail-cli read <message-id>`

### Sending Emails

- Send email: `./.codebuddy/bin/gmail-cli send --to "user@example.com" --subject "Hello" --body "Message text"`
- Send with CC: `./.codebuddy/bin/gmail-cli send --to "user@example.com" --cc "other@example.com" --subject "Hello" --body "Message"`
- Send with attachment: `./.codebuddy/bin/gmail-cli send --to "user@example.com" --subject "Files" --body "See attached" --attach /path/to/file.pdf`
- Multiple attachments: `./.codebuddy/bin/gmail-cli send --to "user@example.com" --subject "Files" --body "Documents" --attach file1.pdf file2.docx`

## Search Query Examples

Gmail CLI supports advanced search queries similar to Gmail's web interface:

- `"from:john@example.com"` - Emails from a specific sender
- `"subject:invoice"` - Emails with "invoice" in subject
- `"has:attachment"` - Emails with attachments
- `"is:unread"` - Unread emails
- `"after:2024/01/01"` - Emails after a specific date
- `"to:me cc:boss@company.com"` - Emails to you with CC to boss
- `"newer_than:2d"` - Emails from last 2 days

Example:

```bash
./.codebuddy/bin/gmail-cli list --query "from:client@company.com subject:invoice has:attachment"
```

## Configuration

Configuration and credentials are stored in:

- `~/.gmail-cli/credentials.json` - OAuth2 credentials (from Google Cloud Console)
- `~/.gmail-cli/token.pickle` - Access token (auto-generated and auto-refreshed)

## Prerequisites

Before using this tool, you need to:

1. Install Python 3.7+
2. Install required packages: `pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib`
3. Set up OAuth2 credentials from Google Cloud Console (see SETUP.md)

## 🔒 Security Best Practices

### File Permissions (MANDATORY)

```bash
# Secure the credential directory
chmod 700 ~/.gmail-cli

# Secure credential files
chmod 600 ~/.gmail-cli/credentials.json
chmod 600 ~/.gmail-cli/token.pickle

# Verify permissions
ls -la ~/.gmail-cli/
# Should show: drwx------ for directory, -rw------- for files
```

### Input Validation

The secure implementation (`gmail-cli-secure.py`) validates all inputs:

- ✅ Email addresses checked against RFC 5322 format
- ✅ File paths validated to prevent path traversal
- ✅ Sensitive files blocked from attachments
- ✅ Text fields sanitized to prevent injection attacks

### Safe Usage Example

```bash
# ✅ SAFE: Properly quoted and validated
EMAIL="user@example.com"
SUBJECT="Monthly Report"
BODY="Please review"
FILE="/path/to/document.pdf"

# Validate before using
[[ -f "$FILE" ]] || exit 1

./.codebuddy/bin/gmail-cli send --to "$EMAIL" --subject "$SUBJECT" \
    --body "$BODY" --attach "$FILE"
```

### ❌ Unsafe Practices

```bash
# DON'T DO THIS: Never use untrusted input directly
read -p "Enter recipient: " RECIPIENT
./.codebuddy/bin/gmail-cli send --to "$RECIPIENT" --subject "Test"

# DON'T DO THIS: Sending sensitive files
./.codebuddy/bin/gmail-cli send --to "user@example.com" \
    --subject "Keys" --attach ~/.ssh/id_rsa  # ❌ DANGER!
```

## Notes

- **OAuth2 Required**: You must complete OAuth2 authentication before using the tool
- **Google Account Access**: Requires a Google account with Gmail enabled
- **API Permissions**: Recommended scopes: `gmail.readonly` + `gmail.send` (NOT `gmail.modify`)
- **Rate Limits**: Subject to Gmail API rate limits (usually sufficient for normal use)
- **Security**: Tokens are stored locally in `~/.gmail-cli/`; must have 600 permissions
- **First Time Setup**: Setup requires creating a Google Cloud project and OAuth2 credentials (see SETUP.md)
- **Token Rotation**: Revoke tokens every 30-90 days or after device loss
- **Shared Systems**: Extra caution on shared computers - use restrictive permissions!

## Troubleshooting

- **Authentication fails**: Try `./.codebuddy/bin/gmail-cli auth --reset` to re-authenticate
- **Package errors**: Install packages with `pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib`
- **Credentials not found**: Make sure `~/.gmail-cli/credentials.json` exists (see SETUP.md)
- **Permission denied**: Ensure the binary has execute permissions: `chmod +x ./.codebuddy/bin/gmail-cli`

## 📚 Documentation

- **SECURITY.md** - 🔒 **READ THIS FIRST** - Comprehensive security guide
- **SETUP.md** - Detailed setup instructions with Google Cloud Console configuration
- **README.md** - Quick start guide and feature overview
- **gmail-cli-secure.py** - Reference implementation with input validation
- **email/skill.md** - Alternative SMTP-based email sending (simpler but less features)

## 🛡️ Security Checklist

Before using Gmail CLI, verify:

- [ ] Installed using `install.sh` script (virtual environment + security audit)
- [ ] `~/.gmail-cli/` has 700 permissions
- [ ] `credentials.json` has 600 permissions
- [ ] `token.pickle` has 600 permissions
- [ ] `.gitignore` configured to exclude sensitive files
- [ ] Using minimal OAuth2 scopes (readonly + send, NOT modify)
- [ ] Read SECURITY.md for best practices
- [ ] Understand how to revoke tokens if compromised

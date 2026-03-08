# Gmail CLI Skill

A secure command-line interface for interacting with Gmail - read, send, and manage emails directly from the terminal.

## ⚠️ Security Notice

**This tool accesses your Gmail account. Security is critical!**

- 🔒 **READ FIRST**: `SECURITY.md` for comprehensive security guidance
- ✅ **USE**: The secure installation script (`install.sh`)
- ⚠️ **NEVER**: Commit credentials or tokens to version control
- 🛡️ **ALWAYS**: Set proper file permissions (700/600)

## 📁 Files

- **SECURITY.md** - 🔒 **MUST READ** - Security best practices and guidelines
- **skill.md** - Main skill documentation with usage examples and commands
- **SETUP.md** - Detailed setup instructions for OAuth2 and Google Cloud Console
- **install.sh** - Automated secure installation script
- **requirements.txt** - Pinned Python dependencies with hash verification
- **.gitignore** - Protects against committing sensitive files
- **gmail-cli-secure.py** - Reference implementation with input validation
- **Binary**: `.codebuddy/bin/gmail-cli` - Python script for Gmail operations (to be created)

## 🚀 Quick Start (Secure Installation)

### ✅ Recommended: Automated Secure Installation

```bash
cd .codebuddy/skills/gmail
bash install.sh
```

**This script provides:**
- ✅ Virtual environment isolation (not global installation)
- ✅ Pinned dependencies with hash verification
- ✅ Secure file permissions (700/600)
- ✅ Security audit with `pip-audit`
- ✅ Credential directory protection

### ⚠️ Manual Installation (Advanced Users)

**Only use manual installation if you understand the security implications!**

1. **Create isolated environment:**
   ```bash
   python3 -m venv .venv-gmail-cli
   source .venv-gmail-cli/bin/activate
   ```

2. **Install Python dependencies with security checks:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt  # Uses pinned versions
   pip install pip-audit && pip-audit  # Check for vulnerabilities
   ```

3. **Set up Google OAuth2 credentials** (see SETUP.md for details):
   - Create a Google Cloud project
   - Enable Gmail API
   - Create OAuth2 credentials (Desktop app)
   - **IMPORTANT**: Save credentials with secure permissions:
     ```bash
     mkdir -p ~/.gmail-cli
     chmod 700 ~/.gmail-cli
     mv ~/Downloads/credentials.json ~/.gmail-cli/
     chmod 600 ~/.gmail-cli/credentials.json
     ```

4. **Create the gmail-cli binary:**
   ```bash
   # Use the secure reference implementation
   cp gmail-cli-secure.py ../.codebuddy/bin/gmail-cli
   chmod 700 ../.codebuddy/bin/gmail-cli
   ```

5. **Authenticate:**
   ```bash
   ./.codebuddy/bin/gmail-cli auth
   ```

6. **Verify security:**
   ```bash
   # Check permissions
   ls -la ~/.gmail-cli/
   # Should show: drwx------ (700) for directory
   # Should show: -rw------- (600) for files
   ```

7. **Start using:**
   ```bash
   # List emails
   ./.codebuddy/bin/gmail-cli list --max 10
   
   # Send email
   ./.codebuddy/bin/gmail-cli send --to "user@example.com" --subject "Hello" --body "Test"
   ```

## 📖 Documentation

- **SECURITY.md** - 🔒 **START HERE** - Security best practices, threat model, incident response
- **skill.md** - Complete command reference and usage examples
- **SETUP.md** - Detailed OAuth2 setup instructions with Google Cloud Console
- **gmail-cli-secure.py** - Reference implementation with input validation

## 🔧 Features

### Core Features
- ✅ OAuth2 authentication (secure, no passwords)
- ✅ List and search emails (Gmail query syntax)
- ✅ Read email content
- ✅ Send emails with attachments
- ✅ Advanced search queries
- ✅ Auto-refreshing tokens

### 🔒 Security Features
- ✅ Input validation (email addresses, file paths, text fields)
- ✅ Minimal OAuth2 scopes (readonly + send, not modify)
- ✅ Secure file permissions enforcement (700/600)
- ✅ Virtual environment isolation
- ✅ Dependency hash verification
- ✅ Security auditing with pip-audit
- ✅ Token management and revocation
- ✅ Path traversal protection
- ✅ Injection attack prevention

## 🆚 Comparison with Email Skill

| Feature | Gmail CLI | Email Skill |
|---------|-----------|-------------|
| Authentication | OAuth2 (more secure) | SMTP credentials |
| Read emails | ✅ Yes | ❌ No |
| Search emails | ✅ Yes | ❌ No |
| Send emails | ✅ Yes | ✅ Yes |
| Attachments | ✅ Yes | ✅ Yes |
| Setup complexity | Higher (requires Google Cloud) | Lower (just SMTP) |

Use **Gmail CLI** when you need full Gmail integration.
Use **Email skill** for simple email sending via SMTP.

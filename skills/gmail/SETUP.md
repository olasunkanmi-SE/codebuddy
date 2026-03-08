# Gmail CLI Setup Instructions

This guide will help you set up the Gmail CLI tool.

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)
- A Google account with Gmail enabled

## Installation Steps

### 1. Install Required Python Packages

```bash
pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib
```

### 2. Copy the Gmail CLI Script

The gmail-cli script should be located at `.codebuddy/bin/gmail-cli`. If it's not there or not executable, run:

```bash
chmod +x .codebuddy/bin/gmail-cli
```

### 3. Set Up Google Cloud Project & OAuth2 Credentials

To use the Gmail API, you need to create OAuth2 credentials:

#### Step 3.1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Gmail CLI")
4. Click "Create"

#### Step 3.2: Enable Gmail API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" and then click "Enable"

#### Step 3.3: Create OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in required fields (App name, User support email, Developer contact)
   - Add your email as a test user
   - Save and continue through the scopes and summary
4. Back to "Create OAuth client ID":
   - Choose "Desktop app" as the application type
   - Give it a name (e.g., "Gmail CLI")
   - Click "Create"
5. Download the credentials JSON file

#### Step 3.4: Save Credentials (SECURE)

⚠️ **CRITICAL SECURITY STEP** - Follow these instructions carefully!

1. Create the configuration directory with **restrictive permissions**:
   ```bash
   # Create directory with owner-only access
   mkdir -p ~/.gmail-cli
   chmod 700 ~/.gmail-cli
   ```
   
   **Why?** Default permissions (755) allow other users on shared systems to read your credentials!

2. Save the downloaded JSON file with **secure permissions**:
   ```bash
   # Move the downloaded credentials file
   mv ~/Downloads/client_secret_*.json ~/.gmail-cli/credentials.json
   
   # Set owner-only read/write permissions
   chmod 600 ~/.gmail-cli/credentials.json
   ```
   
   **Why?** This prevents other users from reading your OAuth2 client secret!

3. **Verify permissions** (IMPORTANT):
   ```bash
   # Check directory permissions (should show: drwx------)
   ls -ld ~/.gmail-cli/
   
   # Check file permissions (should show: -rw-------)
   ls -l ~/.gmail-cli/credentials.json
   ```
   
   **Expected output:**
   ```
   drwx------  2 youruser yourgroup  64 Jan 15 10:30 /home/youruser/.gmail-cli/
   -rw-------  1 youruser yourgroup 450 Jan 15 10:31 /home/youruser/.gmail-cli/credentials.json
   ```

4. **Security verification script** (optional but recommended):
   ```bash
   # Run this to check all permissions
   bash << 'EOF'
   GMAIL_DIR="$HOME/.gmail-cli"
   
   echo "🔍 Checking security permissions..."
   
   # Check directory
   DIR_PERMS=$(stat -c %a "$GMAIL_DIR" 2>/dev/null || stat -f %A "$GMAIL_DIR" 2>/dev/null)
   if [ "$DIR_PERMS" = "700" ]; then
       echo "✓ Directory permissions secure: $DIR_PERMS"
   else
       echo "⚠️  WARNING: Directory has insecure permissions: $DIR_PERMS (should be 700)"
       echo "   Fix with: chmod 700 $GMAIL_DIR"
   fi
   
   # Check credentials file if it exists
   if [ -f "$GMAIL_DIR/credentials.json" ]; then
       CRED_PERMS=$(stat -c %a "$GMAIL_DIR/credentials.json" 2>/dev/null || stat -f %A "$GMAIL_DIR/credentials.json" 2>/dev/null)
       if [ "$CRED_PERMS" = "600" ]; then
           echo "✓ Credentials file secure: $CRED_PERMS"
       else
           echo "⚠️  WARNING: Credentials has insecure permissions: $CRED_PERMS (should be 600)"
           echo "   Fix with: chmod 600 $GMAIL_DIR/credentials.json"
       fi
   fi
   EOF
   ```

### 4. Authenticate

Run the authentication command:

```bash
./.codebuddy/bin/gmail-cli auth
```

This will:
- Open a browser window
- Ask you to log in to your Google account
- Request permission to access Gmail
- Save an authentication token locally

## Verification

Test that everything works:

```bash
# List recent emails
./.codebuddy/bin/gmail-cli list --max 5

# List unread emails
./.codebuddy/bin/gmail-cli list --unread
```

## Troubleshooting

### "Required packages not installed" Error

Install the required packages:
```bash
pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib
```

### "Credentials file not found" Error

Make sure you've:
1. Downloaded the OAuth2 credentials from Google Cloud Console
2. Saved them to `~/.gmail-cli/credentials.json`

### "Permission denied" Error

Make the script executable:
```bash
chmod +x ./.codebuddy/bin/gmail-cli
```

### Authentication Issues

Reset authentication and try again:
```bash
./.codebuddy/bin/gmail-cli auth --reset
```

## Security Notes

### 🔒 Critical Security Requirements

1. **File Permissions** (MANDATORY):
   - Directory: `chmod 700 ~/.gmail-cli/` (owner-only access)
   - Credentials: `chmod 600 ~/.gmail-cli/credentials.json` (owner read/write only)
   - Tokens: `chmod 600 ~/.gmail-cli/token.pickle` (owner read/write only)

2. **Never Commit Secrets to Git**:
   - Add `.gmail-cli/` to your `~/.gitignore` or global gitignore
   - Never commit `credentials.json`, `token.pickle`, or any `.enc` files
   - Use `.gitignore` file provided in `.codebuddy/skills/gmail/.gitignore`

3. **OAuth2 Scopes** (Updated for Security):
   - **Recommended**: Use minimal scopes: `gmail.readonly` + `gmail.send`
   - **Avoid**: `gmail.modify` (allows deletion and modification of emails)
   - Edit the Python binary to change requested scopes

4. **Token Management**:
   - Tokens stored in: `~/.gmail-cli/token.pickle`
   - Tokens auto-refresh but should be rotated every 30-90 days
   - Revoke tokens after device loss: https://myaccount.google.com/permissions
   - Use `gmail-cli token --revoke` command (if implemented)

5. **Shared Systems**:
   - ⚠️ **Extra caution on shared computers/servers**
   - Other users can read your files if permissions are wrong
   - Consider using encrypted home directories
   - Use `ps aux | grep gmail-cli` to check for running processes

6. **Backup Security**:
   - Never backup credentials to cloud storage unencrypted
   - Use encrypted password managers for credential backup
   - Exclude `~/.gmail-cli/` from unencrypted backups

7. **OAuth Consent Screen**:
   - Your app may show as "unverified" - this is normal for personal projects
   - Google requires verification for apps with >100 users
   - You're the only user, so verification not needed

8. **Full-Disk Encryption** (Recommended):
   - Enable FileVault (macOS), BitLocker (Windows), or LUKS (Linux)
   - This protects credentials if device is stolen
   - Does not protect against online attacks or malware

### 🛡️ Security Checklist

Before using Gmail CLI, verify:

- [ ] Python packages installed in virtual environment (not globally)
- [ ] `~/.gmail-cli/` has 700 permissions
- [ ] `credentials.json` has 600 permissions  
- [ ] `.gitignore` configured to exclude sensitive files
- [ ] Using minimal OAuth2 scopes (not `gmail.modify`)
- [ ] Full-disk encryption enabled on device
- [ ] Understand how to revoke tokens if compromised
- [ ] Regular security audits: `pip-audit` in virtual environment

## Alternative: Using App Passwords (Less Recommended)

If you prefer not to use OAuth2, you can use Gmail's App Password feature:

1. Enable 2-Step Verification on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use the existing email skill with SMTP instead (see `email/skill.md`)

Note: This method provides less security and functionality than the OAuth2 approach.

## File Locations

- Script: `.codebuddy/bin/gmail-cli`
- Config directory: `~/.gmail-cli/`
- Credentials: `~/.gmail-cli/credentials.json`
- Token: `~/.gmail-cli/token.pickle`

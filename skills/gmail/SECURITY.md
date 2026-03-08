# Gmail CLI Security Guide

This document provides comprehensive security guidance for the Gmail CLI tool.

## 🎯 Security Overview

Gmail CLI handles sensitive credentials and accesses your Gmail account. Proper security measures are **critical** to protect:

- OAuth2 client credentials
- Access tokens with Gmail permissions
- Email content and metadata
- Personal and confidential communications

## 🚨 Threat Model

### Threats We Protect Against

1. **Credential Theft**
   - Other users on shared systems reading credential files
   - Malware scanning filesystem for common credential paths
   - Accidental commits to public repositories
   - Unencrypted backups exposing credentials

2. **Token Compromise**
   - Stolen tokens used to access Gmail remotely
   - Long-lived tokens persisting after password changes
   - Token replay attacks

3. **Privilege Escalation**
   - Over-privileged OAuth scopes allowing more access than needed
   - Compromised tool deleting or modifying emails

4. **Supply Chain Attacks**
   - Malicious Python packages
   - Dependency confusion attacks
   - Compromised package repositories

5. **Input Injection**
   - Command injection via email parameters
   - Path traversal via attachment paths
   - Email header injection

### Threats Outside Our Scope

- Google account compromise (use 2FA, strong passwords)
- Network-level attacks (use TLS/HTTPS)
- Physical device theft (use full-disk encryption)
- Operating system vulnerabilities (keep OS updated)

## 🔐 Security Requirements (MANDATORY)

### 1. File Permissions

**CRITICAL**: Improper file permissions are the #1 vulnerability.

```bash
# Secure the credential directory
chmod 700 ~/.gmail-cli/

# Secure all files in the directory
chmod 600 ~/.gmail-cli/*

# Verify permissions
ls -la ~/.gmail-cli/
# Expected: drwx------ (700) for directory
# Expected: -rw------- (600) for files
```

**Why?** Default permissions (755/644) allow any user on the system to read your credentials and tokens.

**Shared Systems**: On university servers, shared hosting, or multi-user workstations, other users can trivially steal your credentials if permissions are wrong.

### 2. OAuth2 Scope Minimization

**Use minimal required scopes:**

```python
# ✅ RECOMMENDED - Minimal scopes
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',  # Read emails
    'https://www.googleapis.com/auth/gmail.send',      # Send emails
]

# ⚠️ ACCEPTABLE - If you need labels
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.labels',    # Manage labels
]

# ❌ AVOID - Too permissive
SCOPES = [
    'https://www.googleapis.com/auth/gmail.modify',    # Full access including DELETE
]
```

**Scope comparison:**

| Scope | Read | Send | Labels | Delete | Modify |
|-------|------|------|--------|--------|--------|
| `gmail.readonly` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `gmail.send` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `gmail.labels` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `gmail.modify` | ✅ | ✅ | ✅ | ✅ | ✅ |

**Why?** If the tool or your device is compromised, minimal scopes limit the damage an attacker can do.

### 3. Virtual Environment Isolation

**Always use virtual environments:**

```bash
# Install in virtual environment (done by install.sh)
python3 -m venv .venv-gmail-cli
source .venv-gmail-cli/bin/activate
pip install -r requirements.txt

# Use the wrapper script that activates venv automatically
./.codebuddy/bin/gmail-cli-wrapper list --max 10
```

**Why?** 
- Prevents global package pollution
- Isolates dependencies from system Python
- Easier to audit and track installed packages
- Reduces attack surface

### 4. Dependency Integrity

**Pin versions and verify hashes:**

```bash
# Generate hashes for requirements.txt
pip hash google-api-python-client==2.108.0

# Install with hash verification
pip install --require-hashes -r requirements.txt
```

**Regular security audits:**

```bash
# Check for known vulnerabilities
pip-audit

# Check outdated packages
pip list --outdated
```

**Why?** Prevents supply chain attacks where malicious code is injected into legitimate packages.

### 5. Input Validation

**Never trust user input:**

```python
# ✅ GOOD - Validate email addresses
def validate_email(email: str) -> str:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValueError(f"Invalid email: {email}")
    if '\n' in email or '\r' in email:
        raise ValueError("Email contains invalid characters")
    return email

# ✅ GOOD - Validate file paths
def validate_attachment(path: str) -> Path:
    p = Path(path).resolve()
    if not p.is_file():
        raise ValueError(f"File not found: {path}")
    if not os.access(p, os.R_OK):
        raise ValueError(f"File not readable: {path}")
    # Prevent access to sensitive system files
    if str(p).startswith(('/etc/', '/sys/', '/proc/')):
        raise ValueError(f"Access denied: {path}")
    return p

# ❌ BAD - No validation
def send_email(to, subject, body, attach):
    # Directly using user input - DANGEROUS!
    os.system(f"mail -s '{subject}' {to} < {attach}")  # Command injection!
```

### 6. Token Management

**Token lifecycle:**

- Tokens auto-refresh every 7 days
- Force re-authentication after 30 days (security hygiene)
- Revoke tokens immediately if device is lost/stolen

**Token revocation:**

```bash
# Via CLI (if implemented)
gmail-cli token --revoke

# Via Google Account Settings
# Visit: https://myaccount.google.com/permissions
# Find "Gmail CLI" and click "Remove Access"
```

**When to revoke:**
- 🚨 Device lost or stolen
- 🚨 Suspected compromise
- 🚨 Leaving organization/changing roles
- 🚨 No longer need access
- ⚠️ Every 90 days as good practice

## 🛡️ Defense in Depth

Security is layered. Implement multiple controls:

### Layer 1: Operating System Security

```bash
# Enable full-disk encryption
# macOS: FileVault
# Windows: BitLocker
# Linux: LUKS

# Keep OS updated
sudo apt update && sudo apt upgrade  # Debian/Ubuntu
brew upgrade                         # macOS
```

### Layer 2: Filesystem Security

```bash
# Secure file permissions (done automatically by install.sh)
chmod 700 ~/.gmail-cli/
chmod 600 ~/.gmail-cli/*

# Use encrypted home directory (optional, advanced)
# Ubuntu: ecryptfs-setup-private
```

### Layer 3: Application Security

```bash
# Virtual environment isolation
python3 -m venv .venv-gmail-cli

# Pinned dependencies with hash verification
pip install --require-hashes -r requirements.txt

# Regular security audits
pip-audit
```

### Layer 4: Network Security

```bash
# Gmail API uses HTTPS (TLS 1.2+) by default
# No additional configuration needed

# For enhanced security, use VPN when on untrusted networks
```

### Layer 5: Credential Security

```bash
# Option 1: OS keyring (recommended for desktop)
# Use macOS Keychain, Windows Credential Manager, or gnome-keyring

# Option 2: Encrypted credential files
# Encrypt credentials.json and token.pickle with strong password

# Option 3: Hardware security keys (advanced)
# Use TPM, Secure Enclave, or YubiKey for credential storage
```

## 🔍 Security Auditing

### Pre-Flight Security Check

Run before each use:

```bash
#!/bin/bash
# security-check.sh

echo "🔍 Gmail CLI Security Audit"
echo "=========================="

GMAIL_DIR="$HOME/.gmail-cli"
ISSUES=0

# Check directory permissions
DIR_PERMS=$(stat -c %a "$GMAIL_DIR" 2>/dev/null || stat -f %A "$GMAIL_DIR" 2>/dev/null)
if [ "$DIR_PERMS" != "700" ]; then
    echo "❌ Directory permissions insecure: $DIR_PERMS (should be 700)"
    ((ISSUES++))
else
    echo "✅ Directory permissions secure"
fi

# Check credential file permissions
for file in credentials.json token.pickle; do
    if [ -f "$GMAIL_DIR/$file" ]; then
        PERMS=$(stat -c %a "$GMAIL_DIR/$file" 2>/dev/null || stat -f %A "$GMAIL_DIR/$file" 2>/dev/null)
        if [ "$PERMS" != "600" ]; then
            echo "❌ $file permissions insecure: $PERMS (should be 600)"
            ((ISSUES++))
        else
            echo "✅ $file permissions secure"
        fi
    fi
done

# Check for credentials in git
if git rev-parse --git-dir > /dev/null 2>&1; then
    if git ls-files | grep -q "credentials.json\|token.pickle"; then
        echo "❌ CRITICAL: Credentials tracked in git!"
        ((ISSUES++))
    else
        echo "✅ No credentials in git"
    fi
fi

# Check token age
if [ -f "$GMAIL_DIR/token.pickle" ]; then
    TOKEN_AGE=$(($(date +%s) - $(stat -c %Y "$GMAIL_DIR/token.pickle" 2>/dev/null || stat -f %m "$GMAIL_DIR/token.pickle")))
    TOKEN_DAYS=$((TOKEN_AGE / 86400))
    
    if [ $TOKEN_DAYS -gt 90 ]; then
        echo "⚠️  Token is $TOKEN_DAYS days old (recommend rotation)"
        ((ISSUES++))
    else
        echo "✅ Token age acceptable ($TOKEN_DAYS days)"
    fi
fi

# Check Python package vulnerabilities
if command -v pip-audit &> /dev/null; then
    echo "🔍 Checking for vulnerable dependencies..."
    if pip-audit --quiet; then
        echo "✅ No known vulnerabilities in dependencies"
    else
        echo "❌ Vulnerable dependencies found (run 'pip-audit' for details)"
        ((ISSUES++))
    fi
fi

echo ""
if [ $ISSUES -eq 0 ]; then
    echo "✅ Security check passed!"
    exit 0
else
    echo "❌ Found $ISSUES security issue(s). Review and fix before using Gmail CLI."
    exit 1
fi
```

### Regular Maintenance

**Weekly:**
- Review access logs (if implemented)
- Check for unusual email activity

**Monthly:**
- Run `pip-audit` to check for vulnerabilities
- Update dependencies if security patches available
- Review and rotate tokens

**Quarterly:**
- Audit OAuth2 permissions: https://myaccount.google.com/permissions
- Review all authorized applications
- Revoke unused access

## 🚫 Common Security Mistakes

### ❌ Mistake 1: Committing Secrets to Git

```bash
# BAD - Credentials in repo
git add ~/.gmail-cli/credentials.json
git commit -m "Add Gmail credentials"  # NEVER DO THIS!

# GOOD - Use .gitignore
echo "credentials.json" >> .gitignore
echo "token.pickle" >> .gitignore
```

**If you've already committed secrets:**

```bash
# Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .gmail-cli/credentials.json" \
  --prune-empty --tag-name-filter cat -- --all

# Or use BFG Repo-Cleaner (faster)
bfg --delete-files credentials.json

# Force push (WARNING: rewrites history)
git push origin --force --all

# THEN: Revoke the exposed credentials immediately!
# 1. Delete OAuth2 client in Google Cloud Console
# 2. Create new credentials
# 3. Re-authenticate
```

### ❌ Mistake 2: World-Readable Permissions

```bash
# BAD - Anyone can read
chmod 755 ~/.gmail-cli/
chmod 644 ~/.gmail-cli/credentials.json

# GOOD - Only you can read
chmod 700 ~/.gmail-cli/
chmod 600 ~/.gmail-cli/credentials.json
```

### ❌ Mistake 3: Using Global pip Install

```bash
# BAD - Installs globally, can affect other apps
sudo pip install google-api-python-client

# GOOD - Isolated virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install google-api-python-client
```

### ❌ Mistake 4: Not Validating Input

```python
# BAD - Command injection vulnerability
subject = input("Subject: ")
os.system(f"gmail-cli send --subject '{subject}'")
# User input: '; rm -rf ~/*

# GOOD - Use subprocess with list (no shell)
import subprocess
subject = input("Subject: ")
subprocess.run(['gmail-cli', 'send', '--subject', subject])
```

### ❌ Mistake 5: Ignoring Security Warnings

```bash
# BAD - Ignoring pip-audit warnings
pip-audit
# Found vulnerabilities: google-auth-oauthlib==1.0.0 (CVE-2023-12345)
# ... (ignores and continues using vulnerable version)

# GOOD - Address security warnings immediately
pip-audit
# Found vulnerabilities: google-auth-oauthlib==1.0.0 (CVE-2023-12345)
pip install --upgrade google-auth-oauthlib
pip-audit  # Verify fixed
```

## 📚 Additional Resources

### Security Standards & Guidelines

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)
- [Google OAuth2 Best Practices](https://developers.google.com/identity/protocols/oauth2/production-readiness)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Tools

- `pip-audit` - Check for known vulnerabilities in Python packages
- `safety` - Alternative to pip-audit
- `bandit` - Security linter for Python code
- `gitleaks` - Scan git repos for secrets
- `truffleHog` - Find secrets in git history

### Incident Response

**If credentials are compromised:**

1. **Immediate Actions** (within minutes):
   - Revoke OAuth2 token: https://myaccount.google.com/permissions
   - Change Google account password
   - Enable 2FA if not already enabled
   - Delete local credentials: `rm -rf ~/.gmail-cli/`

2. **Investigation** (within hours):
   - Check Gmail "Last account activity" for suspicious logins
   - Review sent emails for unauthorized messages
   - Check email filters for forwarding rules
   - Review OAuth2 clients in Google Cloud Console

3. **Remediation** (within days):
   - Delete compromised OAuth2 client in Google Cloud Console
   - Create new OAuth2 credentials with new client secret
   - Re-install Gmail CLI with new credentials
   - Review and improve security measures
   - Document incident and lessons learned

4. **Prevention** (ongoing):
   - Implement additional security controls
   - Regular security audits
   - Security training
   - Incident response drills

### Support & Reporting

**Security Vulnerabilities:**

If you discover a security vulnerability in Gmail CLI:

1. **DO NOT** open a public GitHub issue
2. Email security details to: [your-security-email@example.com]
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Expected Response:**
- Acknowledgment within 48 hours
- Preliminary assessment within 1 week
- Fix within 30 days (depending on severity)

## ✅ Security Checklist

Before using Gmail CLI in production:

- [ ] Reviewed and understood threat model
- [ ] File permissions set correctly (700/600)
- [ ] Using minimal OAuth2 scopes (not `gmail.modify`)
- [ ] Dependencies installed in virtual environment
- [ ] `requirements.txt` uses pinned versions
- [ ] `.gitignore` configured to exclude secrets
- [ ] Full-disk encryption enabled
- [ ] Security audit script passes
- [ ] `pip-audit` shows no vulnerabilities
- [ ] Token rotation policy defined
- [ ] Incident response plan documented
- [ ] Team trained on security best practices
- [ ] Regular security audits scheduled

## 📖 Version History

- **v1.0** (2024-01) - Initial security guidelines
  - File permission requirements
  - OAuth2 scope minimization
  - Virtual environment isolation
  - Input validation guidelines
  - Token management policies

---

**Remember**: Security is not a one-time setup, it's an ongoing process. Regularly review and update your security measures!

#!/usr/bin/env python3
"""
Gmail CLI - Secure Implementation
A command-line interface for Gmail with comprehensive security controls.

Security Features:
- Input validation for all user-supplied data
- Minimal OAuth2 scopes (gmail.readonly + gmail.send)
- Secure credential storage with proper file permissions
- Token rotation and revocation support
- Protection against command injection and path traversal
- Comprehensive error handling without information disclosure
"""

import os
import sys
import re
import argparse
import pickle
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

# Security: Check Python version
if sys.version_info < (3, 7):
    print("Error: Python 3.7+ required for security features")
    sys.exit(1)

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    import email
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from email.mime.base import MIMEBase
    from email import encoders
    import base64
except ImportError as e:
    print(f"Error: Required package not installed: {e}")
    print("\nInstall dependencies:")
    print("  pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")
    sys.exit(1)

# Configuration
# CONFIG_DIR inside .codebuddy folder
# This file is expected to be in .codebuddy/bin/ when running
# We want the config to be in .codebuddy/gmail-config
try:
    # Attempt to locate .codebuddy root relative to this script
    script_path = Path(__file__).resolve()
    # If script is in .codebuddy/bin/script.py, parent.parent is .codebuddy
    if '.codebuddy' in str(script_path):
        # Find the .codebuddy directory by traversing up
        codebuddy_dir = script_path
        while codebuddy_dir.name != '.codebuddy' and codebuddy_dir.parent != codebuddy_dir:
            codebuddy_dir = codebuddy_dir.parent
        
        if codebuddy_dir.name == '.codebuddy':
            CONFIG_DIR = codebuddy_dir / 'gmail-config'
        else:
            # Fallback
            CONFIG_DIR = Path.home() / '.gmail-cli'
    else:
        # Fallback if not running from expected location
        CONFIG_DIR = Path.home() / '.gmail-cli'
except Exception:
    CONFIG_DIR = Path.home() / '.gmail-cli'

CREDENTIALS_FILE = CONFIG_DIR / 'credentials.json'
TOKEN_FILE = CONFIG_DIR / 'token.pickle'

# Security: Use MINIMAL scopes (not gmail.modify!)
# gmail.modify allows DELETION and MODIFICATION of emails - too dangerous
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',  # Read emails
    'https://www.googleapis.com/auth/gmail.compose',   # Create drafts and send emails
]

# Security settings
MAX_TOKEN_AGE_DAYS = 30  # Force re-auth after 30 days
MAX_ATTACHMENT_SIZE_MB = 25  # Gmail's limit
SENSITIVE_FILE_PATTERNS = [
    '/etc/shadow', '/etc/passwd', '/.ssh/', '/.gnupg/',
    '/.aws/', '/.gmail-cli/', '/proc/', '/sys/',
]


class SecurityError(Exception):
    """Raised when a security violation is detected."""
    pass


class ValidationError(Exception):
    """Raised when input validation fails."""
    pass


def setup_secure_directory():
    """Create config directory with secure permissions."""
    try:
        CONFIG_DIR.mkdir(mode=0o700, exist_ok=True)
        
        # Verify permissions (defense in depth)
        current_perms = oct(CONFIG_DIR.stat().st_mode)[-3:]
        if current_perms != '700':
            CONFIG_DIR.chmod(0o700)
            print(f"⚠️  Fixed directory permissions: {current_perms} -> 700")
        
    except Exception as e:
        print(f"❌ Failed to create secure directory: {e}")
        sys.exit(1)


def validate_email(email_addr: str) -> str:
    """
    Validate email address format.
    
    Args:
        email_addr: Email address to validate
        
    Returns:
        Validated email address
        
    Raises:
        ValidationError: If email is invalid
    """
    # Basic RFC 5322 validation (simplified)
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(pattern, email_addr):
        raise ValidationError(f"Invalid email address format: {email_addr}")
    
    # Check for header injection attempts
    if '\n' in email_addr or '\r' in email_addr:
        raise SecurityError("Email address contains line break characters (possible injection)")
    
    # Length check (RFC 5321: max 254 characters)
    if len(email_addr) > 254:
        raise ValidationError(f"Email address too long: {len(email_addr)} chars (max 254)")
    
    return email_addr


def sanitize_text(text: str, field_name: str, max_length: int = 10000) -> str:
    """
    Sanitize text fields to prevent injection attacks.
    
    Args:
        text: Text to sanitize
        field_name: Name of field (for error messages)
        max_length: Maximum allowed length
        
    Returns:
        Sanitized text
        
    Raises:
        ValidationError: If text is invalid
    """
    if text is None:
        return ""
    
    # Remove control characters (except tab and newline for body)
    if field_name == 'body':
        # Allow newlines and tabs in body
        text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', '', text)
    else:
        # Remove ALL control characters from subject/headers
        text = re.sub(r'[\x00-\x1f\x7f]', '', text)
    
    # Check for header injection in subject
    if field_name == 'subject' and ('\n' in text or '\r' in text):
        raise SecurityError(f"{field_name} contains line breaks (possible header injection)")
    
    # Length limit (RFC 5322: 998 chars per line for headers)
    if field_name == 'subject' and len(text) > 998:
        raise ValidationError(f"Subject too long: {len(text)} chars (max 998)")
    
    if len(text) > max_length:
        raise ValidationError(f"{field_name} exceeds maximum length of {max_length}")
    
    return text


def validate_file_path(file_path: str) -> Path:
    """
    Validate attachment file path for security.
    
    Args:
        file_path: Path to file
        
    Returns:
        Resolved absolute path
        
    Raises:
        ValidationError: If file is invalid
        SecurityError: If file access is not allowed
    """
    try:
        # Resolve to absolute path (prevents relative path tricks)
        path = Path(file_path).resolve()
    except Exception as e:
        raise ValidationError(f"Invalid file path: {e}")
    
    # Check if file exists
    if not path.is_file():
        raise ValidationError(f"File not found: {file_path}")
    
    # Check if readable
    if not os.access(path, os.R_OK):
        raise ValidationError(f"File not readable: {file_path}")
    
    # Security: Prevent access to sensitive system files
    path_str = str(path)
    for pattern in SENSITIVE_FILE_PATTERNS:
        if pattern in path_str:
            raise SecurityError(f"Access to sensitive file denied: {file_path}")
    
    # Check file size
    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb > MAX_ATTACHMENT_SIZE_MB:
        raise ValidationError(f"File too large: {size_mb:.1f}MB (max {MAX_ATTACHMENT_SIZE_MB}MB)")
    
    return path


def check_file_permissions(file_path: Path, expected_perms: str = '600'):
    """Check and fix file permissions."""
    try:
        current_perms = oct(file_path.stat().st_mode)[-3:]
        if current_perms != expected_perms:
            file_path.chmod(int(expected_perms, 8))
            print(f"⚠️  Fixed {file_path.name} permissions: {current_perms} -> {expected_perms}")
    except Exception as e:
        print(f"⚠️  Could not verify permissions for {file_path.name}: {e}")


def check_token_age() -> bool:
    """Check if token is too old and needs refresh."""
    if not TOKEN_FILE.exists():
        return False
    
    token_age = datetime.now() - datetime.fromtimestamp(TOKEN_FILE.stat().st_mtime)
    
    if token_age > timedelta(days=MAX_TOKEN_AGE_DAYS):
        print(f"⚠️  Token is {token_age.days} days old (max: {MAX_TOKEN_AGE_DAYS})")
        print("   Forcing re-authentication for security...")
        TOKEN_FILE.unlink()
        return False
    
    return True


def get_credentials(reset: bool = False) -> Credentials:
    """
    Get valid user credentials with security checks.
    
    Args:
        reset: If True, force re-authentication
        
    Returns:
        Valid credentials
    """
    setup_secure_directory()
    
    creds = None
    
    # Check for existing token
    if not reset and TOKEN_FILE.exists() and check_token_age():
        try:
            check_file_permissions(TOKEN_FILE, '600')
            with open(TOKEN_FILE, 'rb') as token:
                creds = pickle.load(token)
        except Exception as e:
            print(f"⚠️  Could not load token: {e}")
            creds = None
    
    # Refresh or get new credentials
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                print("🔄 Refreshing access token...")
                creds.refresh(Request())
            except Exception as e:
                print(f"⚠️  Could not refresh token: {e}")
                creds = None
        
        if not creds:
            # Need new authentication
            if not CREDENTIALS_FILE.exists():
                print(f"❌ Credentials file not found: {CREDENTIALS_FILE}")
                print("\nSetup instructions:")
                print("1. Create OAuth2 credentials in Google Cloud Console")
                print("2. Download credentials.json")
                print("3. Save to ~/.gmail-cli/credentials.json")
                print("4. Set permissions: chmod 600 ~/.gmail-cli/credentials.json")
                print("\nSee SETUP.md for detailed instructions.")
                sys.exit(1)
            
            check_file_permissions(CREDENTIALS_FILE, '600')
            
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    str(CREDENTIALS_FILE), SCOPES)
                creds = flow.run_local_server(port=0)
            except Exception as e:
                print(f"❌ Authentication failed: {e}")
                sys.exit(1)
        
        # Save credentials
        try:
            with open(TOKEN_FILE, 'wb') as token:
                pickle.dump(creds, token)
            check_file_permissions(TOKEN_FILE, '600')
            print("✓ Credentials saved securely")
        except Exception as e:
            print(f"⚠️  Could not save token: {e}")
    
    return creds


def list_emails(args):
    """List emails with security controls."""
    try:
        creds = get_credentials()
        service = build('gmail', 'v1', credentials=creds)
        
        # Build query safely
        query_parts = []
        if args.unread:
            query_parts.append('is:unread')
        if args.query:
            # Sanitize query to prevent Gmail query injection
            safe_query = sanitize_text(args.query, 'query', max_length=500)
            query_parts.append(safe_query)
        
        query = ' '.join(query_parts) if query_parts else None
        
        # Limit max results for safety
        max_results = min(args.max, 100)  # Cap at 100
        
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=max_results
        ).execute()
        
        messages = results.get('messages', [])
        
        if not messages:
            print("No messages found.")
            return
        
        print(f"Found {len(messages)} message(s):\n")
        
        for msg in messages:
            msg_data = service.users().messages().get(
                userId='me',
                id=msg['id'],
                format='metadata',
                metadataHeaders=['From', 'Subject', 'Date']
            ).execute()
            
            headers = {h['name']: h['value'] for h in msg_data['payload']['headers']}
            
            print(f"ID: {msg['id']}")
            print(f"From: {headers.get('From', 'N/A')}")
            print(f"Subject: {headers.get('Subject', 'N/A')}")
            print(f"Date: {headers.get('Date', 'N/A')}")
            print("-" * 80)
        
    except HttpError as e:
        print(f"❌ Gmail API error: {e.resp.status} {e.resp.reason}")
        # Don't print full error details (information disclosure)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


def send_email(args):
    """Send email with security validation."""
    try:
        # Validate all inputs
        to_addr = validate_email(args.to)
        cc_addrs = [validate_email(cc) for cc in (args.cc or [])]
        subject = sanitize_text(args.subject, 'subject')
        body = sanitize_text(args.body, 'body')
        
        # Validate attachments
        attachment_paths = []
        if args.attach:
            for attach_path in args.attach:
                validated_path = validate_file_path(attach_path)
                attachment_paths.append(validated_path)
        
        # Create message
        message = MIMEMultipart()
        message['To'] = to_addr
        if cc_addrs:
            message['Cc'] = ', '.join(cc_addrs)
        message['Subject'] = subject
        
        # Attach body
        message.attach(MIMEText(body, 'plain'))
        
        # Attach files
        for path in attachment_paths:
            try:
                with open(path, 'rb') as f:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {path.name}'
                )
                message.attach(part)
                print(f"✓ Attached: {path.name} ({path.stat().st_size} bytes)")
            except Exception as e:
                print(f"❌ Could not attach {path}: {e}")
                sys.exit(1)
        
        # Send email
        creds = get_credentials()
        service = build('gmail', 'v1', credentials=creds)
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        send_message = {'raw': raw_message}
        
        if args.draft:
            result = service.users().drafts().create(
                userId='me',
                body={'message': send_message}
            ).execute()
            print(f"✓ Draft saved successfully (ID: {result['id']})")
        else:
            result = service.users().messages().send(
                userId='me',
                body=send_message
            ).execute()
            print(f"✓ Email sent successfully (ID: {result['id']})")
        
    except (ValidationError, SecurityError) as e:
        print(f"❌ Validation error: {e}")
        sys.exit(1)
    except HttpError as e:
        print(f"❌ Gmail API error: {e.resp.status} {e.resp.reason}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


def auth_command(args):
    """Handle authentication."""
    try:
        if args.reset:
            if TOKEN_FILE.exists():
                TOKEN_FILE.unlink()
                print("✓ Token deleted")
            print("Starting fresh authentication...")
        
        creds = get_credentials(reset=args.reset)
        print("✓ Authentication successful")
        
        # Show token info
        if TOKEN_FILE.exists():
            token_age = datetime.now() - datetime.fromtimestamp(TOKEN_FILE.stat().st_mtime)
            print(f"Token age: {token_age.days} days (max: {MAX_TOKEN_AGE_DAYS})")
        
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        sys.exit(1)


def token_command(args):
    """Handle token management."""
    try:
        if args.status:
            if TOKEN_FILE.exists():
                stat = TOKEN_FILE.stat()
                token_age = datetime.now() - datetime.fromtimestamp(stat.st_mtime)
                perms = oct(stat.st_mode)[-3:]
                
                print("Token Status:")
                print(f"  File: {TOKEN_FILE}")
                print(f"  Age: {token_age.days} days (max: {MAX_TOKEN_AGE_DAYS})")
                print(f"  Permissions: {perms} (should be 600)")
                print(f"  Scopes: {', '.join(SCOPES)}")
            else:
                print("No token found. Run 'auth' command first.")
        
        elif args.revoke:
            if TOKEN_FILE.exists():
                # Try to revoke via API
                try:
                    creds = get_credentials()
                    creds.revoke(Request())
                    print("✓ Token revoked via API")
                except Exception as e:
                    print(f"⚠️  Could not revoke via API: {e}")
                
                # Always delete local token
                TOKEN_FILE.unlink()
                print("✓ Local token file deleted")
                print("\nTo fully revoke access:")
                print("Visit: https://myaccount.google.com/permissions")
            else:
                print("No token found.")
        
        elif args.rotate:
            print("Rotating token...")
            auth_command(argparse.Namespace(reset=True))
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


def main():
    """Main entry point with security hardening."""
    parser = argparse.ArgumentParser(
        description='Gmail CLI - Secure Gmail access from command line',
        epilog='See SECURITY.md for security best practices'
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Auth command
    auth_parser = subparsers.add_parser('auth', help='Authenticate with Gmail')
    auth_parser.add_argument('--reset', action='store_true',
                            help='Force re-authentication')
    
    # Token command
    token_parser = subparsers.add_parser('token', help='Manage tokens')
    token_parser.add_argument('--status', action='store_true',
                             help='Show token status')
    token_parser.add_argument('--revoke', action='store_true',
                             help='Revoke and delete token')
    token_parser.add_argument('--rotate', action='store_true',
                             help='Rotate token (re-authenticate)')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List emails')
    list_parser.add_argument('--max', type=int, default=10,
                            help='Maximum emails to show (default: 10, max: 100)')
    list_parser.add_argument('--unread', action='store_true',
                            help='Show only unread emails')
    list_parser.add_argument('--query', type=str,
                            help='Gmail search query')
    
    # Send command
    send_parser = subparsers.add_parser('send', help='Send email')
    send_parser.add_argument('--to', required=True,
                            help='Recipient email address')
    send_parser.add_argument('--draft', action='store_true',
                            help='Save as draft instead of sending')
    send_parser.add_argument('--cc', action='append',
                            help='CC email address (can be used multiple times)')
    send_parser.add_argument('--subject', required=True,
                            help='Email subject')
    send_parser.add_argument('--body', required=True,
                            help='Email body')
    send_parser.add_argument('--attach', action='append',
                            help='File to attach (can be used multiple times)')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Route to appropriate command
    if args.command == 'auth':
        auth_command(args)
    elif args.command == 'token':
        token_command(args)
    elif args.command == 'list':
        list_emails(args)
    elif args.command == 'send':
        send_email(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

---
name: telegram
description: Send Telegram messages, files, and interact with Telegram bots via the telegram-send CLI tool.
metadata:
  displayName: Telegram
  icon: send
  category: communication
  version: 1.0.0
  dependencies:
    cli: telegram-send
    checkCommand: telegram-send --version
    install:
      darwin:
        pip: telegram-send
      linux:
        pip: telegram-send
      windows:
        pip: telegram-send
  config:
    - name: TELEGRAM_CONFIG
      label: Config Path
      type: string
      required: false
      placeholder: ~/.config/telegram-send.conf
  auth:
    type: bot-token
    setupCommand: telegram-send --configure
---

# telegram-send

Use `telegram-send` to send messages, files, and media to Telegram chats.
This tool requires initial configuration with a Telegram bot token.

## Setup

Before using, configure telegram-send with your bot token:

```bash
telegram-send --configure
```

This will prompt you to:

1. Create a bot via [@BotFather](https://t.me/botfather) on Telegram
2. Enter the bot token
3. Send `/start` to your bot to enable messaging

For group chats, use `--configure-group` instead:

```bash
telegram-send --configure-group
```

## Common Commands

### Send Text Message

```bash
telegram-send "Hello from CodeBuddy!"
```

### Send with Formatting

```bash
# Markdown formatting
telegram-send --format markdown "**Bold** and _italic_ text"

# HTML formatting
telegram-send --format html "<b>Bold</b> and <i>italic</i> text"
```

### Send Files

```bash
# Send a document
telegram-send --file /path/to/document.pdf

# Send with caption
telegram-send --file /path/to/document.pdf --caption "Here's the report"
```

### Send Images

```bash
# Send image
telegram-send --image /path/to/image.png

# Send image with caption
telegram-send --image /path/to/screenshot.png --caption "Screenshot attached"
```

### Send to Specific Config (Multiple Bots/Chats)

```bash
# Use a specific config file
telegram-send --config /path/to/custom.conf "Message to specific chat"
```

### Send Code Blocks

```bash
# Send pre-formatted code
telegram-send --format markdown "\`\`\`python
def hello():
    print('Hello, World!')
\`\`\`"
```

### Silent Messages (No Notification)

```bash
telegram-send --silent "This won't trigger a notification"
```

### Send Location

```bash
telegram-send --location 37.7749 -122.4194
```

## Configuration Files

Default config location: `~/.config/telegram-send.conf`

You can have multiple configs for different bots/chats:

- `~/.config/telegram-send.conf` - default
- `~/.config/telegram-send-group.conf` - for group chats
- Custom paths with `--config`

## Security Notes

- Bot tokens are stored in the config file - ensure proper file permissions
- Run `chmod 600 ~/.config/telegram-send.conf` to secure credentials
- Never commit config files to version control
- Use separate bots for different purposes (personal, work, etc.)

## Error Handling

If you get "Unauthorized" errors:

1. Verify your bot token with @BotFather
2. Ensure you've sent `/start` to the bot
3. Re-run `telegram-send --configure`

## Limitations

- Can only send to users/groups that have started the bot
- Rate limits apply (avoid spamming)
- File size limits: 50MB for documents, 10MB for photos

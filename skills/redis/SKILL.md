---
name: redis
description: Manage Redis databases via the redis-cli tool.
metadata:
  displayName: Redis
  icon: database
  category: databases
  version: 1.0.0
  dependencies:
    cli: redis-cli
    checkCommand: redis-cli --version
    bundledInstall: skills/redis/install.sh
    install:
      darwin:
        brew: redis
      linux:
        apt: redis-tools
        dnf: redis
      windows:
        choco: redis-64
        scoop: redis
  config:
    - name: REDIS_HOST
      label: Host
      type: string
      required: false
      placeholder: localhost
    - name: REDIS_PORT
      label: Port
      type: string
      required: false
      placeholder: "6379"
  auth:
    type: basic
---

# redis-cli

Use `redis-cli` to interact with Redis instances.

## Common Commands

### Connection

- Connect: `redis-cli -h <host> -p <port> -a <password>`

### Operations

- Set key: `SET key value`
- Get key: `GET key`
- List keys: `KEYS pattern`
- Delete key: `DEL key`
- Check info: `INFO`
- Quit: `exit`

## Notes

- Requires `redis-cli` to be installed in the environment.

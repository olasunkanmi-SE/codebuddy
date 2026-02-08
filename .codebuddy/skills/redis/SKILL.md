---
name: redis
description: Manage Redis databases via the redis-cli tool.
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

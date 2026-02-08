---
name: postgres
description: Manage PostgreSQL databases via the psql CLI.
---

# psql

Use `psql` to interact with PostgreSQL databases.

## Common Commands

### Connection
- Connect: `psql "postgresql://user:password@host:port/dbname"`

### Operations
- List databases: `\l`
- List tables: `\dt`
- Describe table: `\d <table_name>`
- Execute query: `SELECT * FROM table LIMIT 10;`
- Quit: `\q`

## Notes
- Requires `psql` to be installed in the environment.

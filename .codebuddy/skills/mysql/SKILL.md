---
name: mysql
description: Manage MySQL databases via the mysql CLI.
---

# mysql

Use `mysql` to interact with MySQL databases.

## Common Commands

### Connection
- Connect: `mysql -h <host> -P <port> -u <user> -p`

### Operations
- Show databases: `SHOW DATABASES;`
- Use database: `USE <dbname>;`
- Show tables: `SHOW TABLES;`
- Describe table: `DESCRIBE <table_name>;`
- Execute query: `SELECT * FROM table LIMIT 10;`
- Quit: `exit`

## Notes
- Requires `mysql` to be installed in the environment.

---
name: mysql
description: Manage MySQL databases via the mysql CLI.
metadata:
  displayName: MySQL
  icon: database
  category: databases
  version: 1.0.0
  dependencies:
    cli: mysql
    checkCommand: mysql --version
    bundledInstall: skills/mysql/install.sh
    install:
      darwin:
        brew: mysql-client
      linux:
        apt: mysql-client
        dnf: mysql
      windows:
        winget: Oracle.MySQL
        choco: mysql
        scoop: mysql
  config:
    - name: MYSQL_HOST
      label: Host
      type: string
      required: false
      placeholder: localhost
    - name: MYSQL_PORT
      label: Port
      type: string
      required: false
      placeholder: "3306"
  auth:
    type: basic
---

# mysql

Use `mysql` to interact with MySQL databases.

## Setup

The `mysql` client is installed in `.codebuddy/bin/`.
You can execute it directly or add it to your PATH.

## Common Commands

### Connection

- Connect: `.codebuddy/bin/mysql -h <host> -P <port> -u <user> -p`
- Connect (Docker example): `.codebuddy/bin/mysql -h 127.0.0.1 -P 3306 -u root -p`

### Quick Alias

To make it easier to run, you can alias it in your shell:
`alias mysql="./.codebuddy/bin/mysql"`

### Operations

- Show databases: `SHOW DATABASES;`
- Use database: `USE <dbname>;`
- Show tables: `SHOW TABLES;`
- Describe table: `DESCRIBE <table_name>;`
- Execute query: `SELECT * FROM table LIMIT 10;`
- Quit: `exit`

## Notes

- The binary is located at: `.codebuddy/bin/mysql`
- Password can be supplied via `MYSQL_PWD` environment variable (careful!) or typically prompted interactively.

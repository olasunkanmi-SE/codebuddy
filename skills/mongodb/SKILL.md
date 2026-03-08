---
name: mongodb
description: Manage MongoDB databases via the mongosh tool.
metadata:
  displayName: MongoDB
  icon: database
  category: databases
  version: 1.0.0
  dependencies:
    cli: mongosh
    checkCommand: mongosh --version
    install:
      darwin:
        brew: mongosh
      linux:
        apt: mongodb-mongosh
        script: wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add - && sudo apt install mongodb-mongosh
      windows:
        winget: MongoDB.Shell
        choco: mongodb-shell
        scoop: mongosh
  config:
    - name: MONGODB_URI
      label: Connection URI
      type: string
      required: false
      placeholder: mongodb://localhost:27017
  auth:
    type: none
---

# mongosh

Use `mongosh` to interact with MongoDB databases.

## Common Commands

### Connection

- Connect: `mongosh "mongodb://user:password@host:port/dbname"`

### Operations

- Show databases: `show dbs`
- Use database: `use <dbname>`
- Show collections: `show collections`
- Find documents: `db.collection.find().limit(5)`
- Insert document: `db.collection.insertOne({ key: "value" })`
- Quit: `exit`

## Notes

- Requires `mongosh` to be installed in the environment.

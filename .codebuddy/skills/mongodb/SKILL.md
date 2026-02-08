---
name: mongodb
description: Manage MongoDB databases via the mongosh tool.
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

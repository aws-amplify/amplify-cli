# GraphQL Schema Migrator

# Reference documentation

### `attemptV2TransformerMigration`
- Calls to `attemptV2TransformerMigration` are the only ones allowed outside the package, it will initiate a series of prompting and operations around \
the migration process and return true or false depending on whether the migration is complete
- The process will exit if there's an unrecoverable case or if the customer chooses to exit the CLI for further review of migrated schema

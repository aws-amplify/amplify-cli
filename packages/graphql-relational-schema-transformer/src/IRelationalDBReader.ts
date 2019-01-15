import { TableContext } from "./RelationalDBSchemaTransformer";

/**
 * An interface to manage interactions with a relational database across
 * various forms of clients.
 */
export interface IRelationalDBReader {
    begin(databaseName: string): Promise<void>

    listTables(databaseName: string): Promise<string[]>

    getTableForeignKeyReferences(tableName: string): Promise<string[]>

    describeTable(tableName: string): Promise<TableContext>

    end(): Promise<void>
}
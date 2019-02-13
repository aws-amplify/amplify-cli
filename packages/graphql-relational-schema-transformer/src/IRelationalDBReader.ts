import TemplateContext, { TableContext } from "./RelationalDBSchemaTransformer";

/**
 * An interface to manage interactions with a relational database across
 * various forms of clients.
 */
export interface IRelationalDBReader {
    listTables(): Promise<string[]>

    getTableForeignKeyReferences(tableName: string): Promise<string[]>

    describeTable(tableName: string): Promise<TableContext>

    hydrateTemplateContext(contextShell: TemplateContext): Promise<TemplateContext>
}
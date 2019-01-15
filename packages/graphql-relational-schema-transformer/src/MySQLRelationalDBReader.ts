import { IRelationalDBReader } from "./IRelationalDBReader";
import {createConnection, Connection, MysqlError, FieldInfo} from 'mysql'
import { TableContext } from "./RelationalDBSchemaTransformer";
import { getNamedType, getNonNullType, getInputValueDefinition, getGraphQLTypeFromMySQLType,
    getTypeDefinition, getFieldDefinition, getInputTypeDefinition } from './RelationalDBSchemaTransformerUtils'

/**
 * A class to manage interactions with a MySQL relational databse
 * over a jdbc connection.
 */
export class MySQLRelationalDBReader implements IRelationalDBReader {

    connection: Connection
    dbUser: string
    dbPassword: string
    dbHost: string

    constructor(dbUser: string, dbPassword: string, dbHost: string) {
        this.dbUser = dbUser
        this.dbPassword = dbPassword
        this.dbHost = dbHost
    }

    /**
     * Closes up the connection when all interactions are done.
     */
    end = async(): Promise<void> => {
        this.connection.end()
    }

    /**
     * Sets the connection to use the provided database name during future interactions.
     *
     * @param databaseName the name of the database to use.
     */
    begin = async (databaseName: string): Promise<void> => {
        this.connection = createConnection({user: this.dbUser, password: this.dbPassword, host: this.dbHost})
        await this.executeSQL(`USE ${databaseName}`)
    }

    /**
     * Gets a list of all the table names in the provided database.
     *
     * @param databaseName the name of the database to get tables from.
     * @returns a list of tablenames inside the database.
     */
    listTables = async (databaseName: string): Promise<string[]> => {
        const results = await this.executeSQL(`SHOW TABLES`)
        return results.map(result => result[`Tables_in_${databaseName}`])
    }

    /**
     * Looks up any foreign key constraints that might exist for the provided table.
     * This is done to ensure our generated schema includes nested types, where possible.
     *
     * @param tableName the name of the table to be checked for foreign key constraints.
     * @returns a list of table names that are applicable as having constraints.
     */
    getTableForeignKeyReferences = async (tableName: string) : Promise<string[]> => {
        const results = await this.executeSQL
            (`SELECT TABLE_NAME FROM information_schema.key_column_usage
            WHERE referenced_table_name is not null
            AND REFERENCED_TABLE_NAME = '${tableName}';`)
        return results.map(result => result[`TABLE_NAME`])
    }

    /**
     * For the provided table, this will create a table context. That context holds definitions for
     * the base table type, the create input type, and the update input type (e.g. Post, CreatePostInput, and UpdatePostInput, respectively),
     * as well as the table primary key structure for proper operation definition.
     *
     * Create inputs will only differ from the base table type in that any nested types will not be present. Update table
     * inputs will differ in that the only required field will be the primary key/identifier, as all fields don't have to
     * be updated. Instead, it assumes the proper ones were provided on create.
     *
     * @param tableName the name of the table to be translated into a GraphQL type.
     * @returns a promise of a table context structure.
     */
    describeTable = async (tableName: string): Promise<TableContext> => {
        const columnDescriptions = await this.executeSQL(`DESCRIBE ${tableName}`)
        // Fields in the general type (e.g. Post). Both the identifying field and any others the db dictates will be required.
        const fields = new Array()
        // Fields in the update input type (e.g. UpdatePostInput). Only the identifying field will be required, any others will be optional.
        const updateFields = new Array()
        // Field in the create input type (e.g. CreatePostInput).
        const createFields = new Array()

        // The primary key, used to help generate queries and mutations
        let primaryKey = ""
        let primaryKeyType = ""

        // Field Lists needed as context for auto-generating the Query Resolvers
        const intFieldList = new Array()
        const stringFieldList = new Array()

        for (const columnDescription of columnDescriptions) {
            // If a field is the primary key, save it.
            if (columnDescription.Key == 'PRI') {
                primaryKey = columnDescription.Field
                primaryKeyType = getGraphQLTypeFromMySQLType(columnDescription.Type)
            } else {
                /**
                 * If the field is not a key, then store it in the fields list.
                 * As we need this information later to generate query resolvers
                 *
                 * Currently we will only auto-gen query resolvers for the Int and String scalars
                 */
                const type = getGraphQLTypeFromMySQLType(columnDescription.Type)
                if (type === 'Int') {
                    intFieldList.push(columnDescription.Field)
                } else if (type === 'String') {
                    stringFieldList.push(columnDescription.Field)
                }
            }

            // Create the basic field type shape, to be consumed by every field definition
            const baseType = getNamedType(getGraphQLTypeFromMySQLType(columnDescription.Type))

            const isPrimaryKey = columnDescription.Key == 'PRI'
            const isNullable = columnDescription.Null == 'YES'

            // Generate the field for the general type and the create input type
            const type = (!isPrimaryKey && isNullable) ? baseType : getNonNullType(baseType)
            fields.push(getFieldDefinition(columnDescription.Field, type))

            createFields.push(getInputValueDefinition(type, columnDescription.Field))

            // Update<type>Input has only the primary key as required, ignoring all other that the database requests as non-nullable
            const updateType = !isPrimaryKey ? baseType : getNonNullType(baseType)
            updateFields.push(getInputValueDefinition(updateType, columnDescription.Field))
        }

        // Add foreign key for this table
        let tablesWithRef = await this.getTableForeignKeyReferences(tableName)
        for (const tableWithRef of tablesWithRef) {
            if (tableWithRef && tableWithRef.length > 0) {
                const baseType = getNamedType(`${tableWithRef}Connection`)
                fields.push(getFieldDefinition(`${tableWithRef}`, baseType))
            }
        }

        return new TableContext(getTypeDefinition(fields, tableName), getInputTypeDefinition(createFields, `Create${tableName}Input`),
                getInputTypeDefinition(updateFields, `Update${tableName}Input`), primaryKey, primaryKeyType, stringFieldList, intFieldList)
    }


    /**
     * Executes the provided SQL statement.
     *
     * @returns a promise with the execution response.
     */
    private executeSQL = async (sqlString: string): Promise<any> => {
        return await new Promise<FieldInfo[]>((resolve, reject) => {
            this.connection.query(sqlString, (err: MysqlError | null, results?: any, fields?: FieldInfo[]) => {
                if (err) {
                    console.log(`Failed to execute ${sqlString}`)
                    reject(err)
                }
                resolve(results)
            })
        })
    }
}
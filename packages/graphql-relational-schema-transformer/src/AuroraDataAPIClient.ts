
/**
 * 
 */
export class AuroraDataAPIClient {

    AWS: any
    RDS: any
    Params: DataApiParams

    constructor(databaseRegion: string, awsSecretStoreArn: string, dbClusterOrInstanceArn: string, database: string) {
        this.AWS = require('aws-sdk')
        this.AWS.config.update({
            region: databaseRegion
        })

        this.RDS = new this.AWS.RDSDataService()
        this.Params = new DataApiParams()

        this.Params.awsSecretStoreArn = awsSecretStoreArn
        this.Params.dbClusterOrInstanceArn = dbClusterOrInstanceArn
        this.Params.database = database 
    }

    public listTables = async () => {
        this.Params.sqlStatements = 'SHOW TABLES'
        const response = await this.RDS.executeSql(this.Params).promise()

        let tableList = []
        const records = response['sqlStatementResults'][0]['resultFrame']['records']
        for (const record of records) {
            tableList.push(record['values'][0]['stringValue'])
        }

        return tableList
    }

    public describeTable = async (tableName: string) => {
        this.Params.sqlStatements = `DESCRIBE ${tableName}`
        const response = await this.RDS.executeSql(this.Params).promise()

        const listOfColumns = response['sqlStatementResults'][0]['resultFrame']['records']
        let columnDescriptions = []
        for (const column of listOfColumns) {
            let colDescription = new ColumnDescription()
            const colValues = column['values']

            colDescription.Field = colValues[MYSQL_DESCRIBE_TABLE_ORDER.Field]['stringValue']
            colDescription.Type = colValues[MYSQL_DESCRIBE_TABLE_ORDER.Type]['stringValue']
            colDescription.Null = colValues[MYSQL_DESCRIBE_TABLE_ORDER.Null]['stringValue']
            colDescription.Key = colValues[MYSQL_DESCRIBE_TABLE_ORDER.Key]['stringValue']
            colDescription.Default = colValues[MYSQL_DESCRIBE_TABLE_ORDER.Default]['stringValue']
            colDescription.Extra = colValues[MYSQL_DESCRIBE_TABLE_ORDER.Extra]['stringValue']

            columnDescriptions.push(colDescription)
        }
        
        return columnDescriptions
    }

    public getTableForeignKeyReferences = async (tableName: string) => {
        this.Params.sqlStatements = `SELECT TABLE_NAME FROM information_schema.key_column_usage 
            WHERE referenced_table_name is not null 
            AND REFERENCED_TABLE_NAME = '${tableName}';`
        const response = await this.RDS.executeSql(this.Params).promise()

        let tableList = []
        const records = response['sqlStatementResults'][0]['resultFrame']['records']
        for (const record of records) {
            tableList.push(record['values'][0]['stringValue'])
        }

        return tableList
    }

}

export class DataApiParams {
    awsSecretStoreArn: string
    dbClusterOrInstanceArn: string
    sqlStatements: string
    database: string
}

export class ColumnDescription {
    Field: string
    Type: string
    Null: string
    Key: string
    Default: string
    Extra: string
}

enum MYSQL_DESCRIBE_TABLE_ORDER {
    Field,
    Type,
    Null,
    Key,
    Default,
    Extra
}
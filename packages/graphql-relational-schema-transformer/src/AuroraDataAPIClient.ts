/**
 * A wrapper around the RDS data service client, forming their responses for
 * easier consumption.
 */
export class AuroraDataAPIClient {
  AWS: any;
  RDS: any;
  Params: DataApiParams;
  isPostgres: boolean;

  setRDSClient(rdsClient: any) {
    this.RDS = rdsClient;
  }

  async getIsPostgres() {
    if (typeof this.isPostgres === 'undefined') {
      const dbCluster = await new this.AWS.RDS().describeDBClusters().promise();
      this.isPostgres = dbCluster.DBClusters.some(cluster => cluster.Engine.includes('postgres'));
    }
    return this.isPostgres;
  }

  constructor(databaseRegion: string, awsSecretStoreArn: string, dbClusterOrInstanceArn: string, database: string, aws: any, isPostgres?: boolean) {
    this.AWS = aws;
    this.AWS.config.update({
      region: databaseRegion,
    });

    this.RDS = new this.AWS.RDSDataService();
    this.Params = new DataApiParams();
    this.isPostgres = isPostgres
    this.Params.secretArn = awsSecretStoreArn;
    this.Params.resourceArn = dbClusterOrInstanceArn;
    this.Params.database = database;
  }

  /**
   * Lists all of the tables in the set database.
   *
   * @return a list of tables in the database.
   */
  public listTables = async () => {
    this.Params.sql = await this.getIsPostgres()
      ? "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
      : 'SHOW TABLES';
    const response = await this.RDS.executeStatement(this.Params).promise();

    let tableList = [];
    const records = response['records'];
    for (const record of records) {
      tableList.push(record[0]['stringValue']);
    }

    return tableList;
  };

  /**
   * Describes the table given, by breaking it down into individual column descriptions.
   *
   * @param the name of the table to be described.
   * @return a list of column descriptions.
   */
  public describeTable = async (tableName: string) => {
    this.Params.sql = await this.getIsPostgres()
      ? `
    SELECT
      *
    FROM 
      information_schema.columns
    WHERE 
      table_name = '${tableName}'`
      : `DESCRIBE \`${tableName}\``;

    const response = await this.RDS.executeStatement(this.Params).promise();
    let primaryKey = '';
    if (await this.getIsPostgres()) {
      // get primaryKey for table
      const primaryKeyResponse = await this.RDS.executeStatement({
        ...this.Params,
        sql: `SELECT               
        pg_attribute.attname, 
        format_type(pg_attribute.atttypid, pg_attribute.atttypmod) 
      FROM pg_index, pg_class, pg_attribute, pg_namespace 
      WHERE 
        pg_class.oid = '"${tableName}"'::regclass AND 
        indrelid = pg_class.oid AND 
        nspname = 'public' AND 
        pg_class.relnamespace = pg_namespace.oid AND 
        pg_attribute.attrelid = pg_class.oid AND 
        pg_attribute.attnum = any(pg_index.indkey)
      AND indisprimary`,
      }).promise();
      if (primaryKeyResponse.records.length) {
        primaryKey = primaryKeyResponse.records[0][0].stringValue;
      }
    }

    const listOfColumns = response['records'];

    let columnDescriptions = [];
    for (const column of listOfColumns) {
      let colDescription = new ColumnDescription();

      if (await this.getIsPostgres()) {
        colDescription.Field = column[POSTGRES_DESCRIBE_TABLE_ORDER.ColumnName]['stringValue'];
        colDescription.Type = column[POSTGRES_DESCRIBE_TABLE_ORDER.DataType]['stringValue'];
        colDescription.Null = column[POSTGRES_DESCRIBE_TABLE_ORDER.IsNullable]['stringValue'];
        colDescription.Key = colDescription.Field === primaryKey ? 'PRI' : '';
        colDescription.Default = column[POSTGRES_DESCRIBE_TABLE_ORDER.ColumnDefault]['stringValue'];
        colDescription.Extra = '';
      } else {
        colDescription.Field = column[MYSQL_DESCRIBE_TABLE_ORDER.Field]['stringValue'];
        colDescription.Type = column[MYSQL_DESCRIBE_TABLE_ORDER.Type]['stringValue'];
        colDescription.Null = column[MYSQL_DESCRIBE_TABLE_ORDER.Null]['stringValue'];
        colDescription.Key = column[MYSQL_DESCRIBE_TABLE_ORDER.Key]['stringValue'];
        colDescription.Default = column[MYSQL_DESCRIBE_TABLE_ORDER.Default]['stringValue'];
        colDescription.Extra = column[MYSQL_DESCRIBE_TABLE_ORDER.Extra]['stringValue'];
      }

      columnDescriptions.push(colDescription);
    }

    return columnDescriptions;
  };

  /**
   * Gets foreign keys for the given table, if any exist.
   *
   * @param tableName the name of the table to be checked.
   * @return a list of tables referencing the provided table, if any exist.
   */
  public getTableForeignKeyReferences = async (tableName: string) => {
    this.Params.sql = await this.getIsPostgres()
      ? `SELECT 
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema, 
        ccu.table_name AS foreign_table_name, 
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema 
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
        AND ccu.table_schema = tc.table_schema 
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = '${tableName}'`
      : `SELECT TABLE_NAME FROM information_schema.key_column_usage
            WHERE referenced_table_name is not null 
            AND REFERENCED_TABLE_NAME = '${tableName}';`;
    const response = await this.RDS.executeStatement(this.Params).promise();
    let tableList = [];
    const records = response['records'];
    for (const record of records) {
      tableList.push(record[0]['stringValue']);
    }

    return tableList;
  };
}

export class DataApiParams {
  database: string;
  secretArn: string;
  resourceArn: string;
  sql: string;
}

export class ColumnDescription {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string;
  Extra: string;
}

enum MYSQL_DESCRIBE_TABLE_ORDER {
  Field,
  Type,
  Null,
  Key,
  Default,
  Extra,
}

enum POSTGRES_DESCRIBE_TABLE_ORDER {
  TableCatalog,
  TableSchema,
  TableName,
  ColumnName,
  OrdinalPosition,
  ColumnDefault,
  IsNullable,
  DataType,
  CharacterMaximumLength,
  CharacterOctetLength,
  NumericPrecision,
  NumericPrecisionRadix,
  NumericScale,
  DatetimePrecision,
  IntervalType,
  IntervalPrecision,
  CharacterSetCatalog,
  CharacterSetSchema,
  CharacterSetName,
  CollationCatalog,
  CollationSchema,
  CollationName,
  DomainCatalog,
  DomainSchema,
  DomainName,
  UdtCatalog,
  UdtSchema,
  UdtName,
  ScopeCatalog,
  ScopeSchema,
  ScopeName,
  MaximumCardinality,
  DtdIdentifier,
  IsSelfReferencing,
  IsIdentity,
  IdentityGeneration,
  IdentityStart,
  IdentityIncrement,
  IdentityMaximum,
  IdentityMinimum,
  IdentityCycle,
  IsGenerated,
  GenerationExpression,
  IsUpdatable,
}

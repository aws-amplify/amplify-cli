import { Kind, ObjectTypeDefinitionNode, SchemaDefinitionNode, InputObjectTypeDefinitionNode, DocumentNode } from 'graphql';
import {
  getSingletonListTypeNode,
  getNamedType,
  getOperationFieldDefinition,
  getNonNullType,
  getInputValueDefinition,
  getTypeDefinition,
  getFieldDefinition,
  getDirectiveNode,
  getOperationTypeDefinition,
} from './RelationalDBSchemaTransformerUtils';
import { RelationalDBParsingException } from './RelationalDBParsingException';
import { IRelationalDBReader } from './IRelationalDBReader';
import { plurality, toUpper } from 'graphql-transformer-common';

/**
 * This class is used to transition all of the columns and key metadata from a table for use
 * in generating appropriate GraphQL schema structures. It will track type definitions for
 * the base table, update mutation inputs, create mutation inputs, and primary key metadata.
 */
export class TableContext {
  tableTypeDefinition: ObjectTypeDefinitionNode;
  createTypeDefinition: InputObjectTypeDefinitionNode;
  updateTypeDefinition: InputObjectTypeDefinitionNode;
  // Table primary key metadata, to help properly key queries and mutations.
  tableKeyField: string;
  tableKeyFieldType: string;
  stringFieldList: string[];
  intFieldList: string[];
  constructor(
    typeDefinition: ObjectTypeDefinitionNode,
    createDefinition: InputObjectTypeDefinitionNode,
    updateDefinition: InputObjectTypeDefinitionNode,
    primaryKeyField: string,
    primaryKeyType: string,
    stringFieldList: string[],
    intFieldList: string[],
  ) {
    this.tableTypeDefinition = typeDefinition;
    this.tableKeyField = primaryKeyField;
    this.createTypeDefinition = createDefinition;
    this.updateTypeDefinition = updateDefinition;
    this.tableKeyFieldType = primaryKeyType;
    this.stringFieldList = stringFieldList;
    this.intFieldList = intFieldList;
  }
}

/**
 * This class is used to transition all of the information needed to generate the
 * CloudFormation template. This is the class that is outputted by the SchemaTransformer and the one that
 * RelationalDBTemplateGenerator takes in for the constructor. It tracks the graphql schema document,
 * map of the primary keys for each of the types. It is also being used to track the CLI inputs needed
 * for DataSource Creation, as data source creation is apart of the cfn template generation.
 */
export class TemplateContext {
  schemaDoc: DocumentNode;
  typePrimaryKeyMap: Map<string, string>;
  typePrimaryKeyTypeMap: Map<string, string>;
  stringFieldMap: Map<string, string[]>;
  intFieldMap: Map<string, string[]>;
  secretStoreArn: string;
  rdsClusterIdentifier: string;
  databaseName: string;
  databaseSchema: string;
  region: string;

  constructor(
    schemaDoc: DocumentNode,
    typePrimaryKeyMap: Map<string, string>,
    stringFieldMap: Map<string, string[]>,
    intFieldMap: Map<string, string[]>,
    typePrimaryKeyTypeMap?: Map<string, string>,
  ) {
    this.schemaDoc = schemaDoc;
    this.typePrimaryKeyMap = typePrimaryKeyMap;
    this.stringFieldMap = stringFieldMap;
    this.intFieldMap = intFieldMap;
    this.typePrimaryKeyTypeMap = typePrimaryKeyTypeMap;
  }
}

export class RelationalDBSchemaTransformer {
  dbReader: IRelationalDBReader;
  database: string;
  improvePluralization: boolean;

  constructor(dbReader: IRelationalDBReader, database: string, improvePluralization: boolean) {
    this.dbReader = dbReader;
    this.database = database;
    this.improvePluralization = improvePluralization;
  }

  public introspectDatabaseSchema = async (): Promise<TemplateContext | null> => {
    // Get all of the tables within the provided db
    let tableNames = null;

    try {
      tableNames = await this.dbReader.listTables();
    } catch (err) {
      throw new RelationalDBParsingException(`Failed to list tables in ${this.database}`, err.stack);
    }

    // Return early if there are no tables in the database
    if (tableNames.length === 0) {
      return null;
    }

    const typeContexts = new Array();
    const types = new Array();
    const pkeyMap = new Map<string, string>();
    const pkeyTypeMap = new Map<string, string>();
    const stringFieldMap = new Map<string, string[]>();
    const intFieldMap = new Map<string, string[]>();

    for (const tableName of tableNames) {
      let type: TableContext = null;

      try {
        type = await this.dbReader.describeTable(tableName);
      } catch (err) {
        throw new RelationalDBParsingException(`Failed to describe table ${tableName}`, err.stack);
      }

      // NOTE from @mikeparisstuff. The GraphQL schema generation breaks
      // when the table does not have an explicit primary key.
      if (type.tableKeyField) {
        typeContexts.push(type);
        // Generate the 'connection' type for each table type definition
        // TODO: Determine if Connection is needed as Data API doesn't provide pagination
        // TODO: As we add different db sources, we should conditionally do this even if we don't for Aurora serverless.
        //types.push(this.getConnectionType(tableName))
        // Generate the create operation input for each table type definition
        types.push(type.createTypeDefinition);
        // Generate the default shape for the table's structure
        types.push(type.tableTypeDefinition);
        // Generate the update operation input for each table type definition
        types.push(type.updateTypeDefinition);

        // Update the field map with the new field lists for the current table
        stringFieldMap.set(tableName, type.stringFieldList);
        intFieldMap.set(tableName, type.intFieldList);
        pkeyMap.set(tableName, type.tableKeyField);
        pkeyTypeMap.set(tableName, type.tableKeyFieldType);
      } else {
        console.warn(`Skipping table ${type.tableTypeDefinition.name.value} because it does not have a single PRIMARY KEY.`);
      }
    }

    if (typeContexts.length > 0) {
      // Generate the mutations and queries based on the table structures
      types.push(this.getMutations(typeContexts));
      types.push(this.getQueries(typeContexts));
      types.push(this.getSubscriptions(typeContexts));
      types.push(this.getSchemaType());
    }

    let context = this.dbReader.hydrateTemplateContext(
      new TemplateContext({ kind: Kind.DOCUMENT, definitions: types }, pkeyMap, stringFieldMap, intFieldMap, pkeyTypeMap),
    );

    return context;
  };

  /**
   * Creates a schema type definition node, including operations for each of query, mutation, and subscriptions.
   *
   * @returns a basic schema definition node.
   */
  getSchemaType(): SchemaDefinitionNode {
    return {
      kind: Kind.SCHEMA_DEFINITION,
      directives: [],
      operationTypes: [
        getOperationTypeDefinition('query', getNamedType('Query')),
        getOperationTypeDefinition('mutation', getNamedType('Mutation')),
        getOperationTypeDefinition('subscription', getNamedType('Subscription')),
      ],
    };
  }

  /**
   * Generates the basic mutation operations, given the provided table contexts. This will
   * create a create, delete, and update operation for each table.
   *
   * @param types the table contexts from which the mutations are to be generated.
   * @returns the type definition for mutations, including a create, delete, and update for each table.
   */
  private getMutations(types: TableContext[]): ObjectTypeDefinitionNode {
    const fields = [];

    for (const typeContext of types) {
      const type = typeContext.tableTypeDefinition;
      const formattedTypeValue = toUpper(type.name.value);

      fields.push(
        getOperationFieldDefinition(
          `delete${formattedTypeValue}`,
          [getInputValueDefinition(getNonNullType(getNamedType(typeContext.tableKeyFieldType)), typeContext.tableKeyField)],
          getNamedType(`${type.name.value}`),
          null,
        ),
      );

      fields.push(
        getOperationFieldDefinition(
          `create${formattedTypeValue}`,
          [getInputValueDefinition(getNonNullType(getNamedType(`Create${formattedTypeValue}Input`)), `create${formattedTypeValue}Input`)],
          getNamedType(`${type.name.value}`),
          null,
        ),
      );

      fields.push(
        getOperationFieldDefinition(
          `update${formattedTypeValue}`,
          [getInputValueDefinition(getNonNullType(getNamedType(`Update${formattedTypeValue}Input`)), `update${formattedTypeValue}Input`)],
          getNamedType(`${type.name.value}`),
          null,
        ),
      );
    }

    return getTypeDefinition(fields, 'Mutation');
  }

  /**
   * Generates the basic subscription operations, given the provided table contexts. This will
   * create an onCreate subscription for each table.
   *
   * @param types the table contexts from which the subscriptions are to be generated.
   * @returns the type definition for subscriptions, including an onCreate for each table.
   */
  private getSubscriptions(types: TableContext[]): ObjectTypeDefinitionNode {
    const fields = [];

    for (const typeContext of types) {
      const type = typeContext.tableTypeDefinition;
      const formattedTypeValue = toUpper(type.name.value);

      fields.push(
        getOperationFieldDefinition(`onCreate${formattedTypeValue}`, [], getNamedType(`${type.name.value}`), [
          getDirectiveNode(`create${formattedTypeValue}`),
        ]),
      );
    }

    return getTypeDefinition(fields, 'Subscription');
  }

  /**
   * Generates the basic query operations, given the provided table contexts. This will
   * create a get and list operation for each table.
   *
   * @param types the table contexts from which the queries are to be generated.
   * @returns the type definition for queries, including a get and list for each table.
   */
  private getQueries(types: TableContext[]): ObjectTypeDefinitionNode {
    const fields = [];

    for (const typeContext of types) {
      const type = typeContext.tableTypeDefinition;
      const formattedTypeValue = toUpper(type.name.value);

      fields.push(
        getOperationFieldDefinition(
          `get${formattedTypeValue}`,
          [getInputValueDefinition(getNonNullType(getNamedType(typeContext.tableKeyFieldType)), typeContext.tableKeyField)],
          getNamedType(`${type.name.value}`),
          null,
        ),
      );

      // use list type node to match the ast of current schema built by graphql.parse
      const nameListType = getSingletonListTypeNode(type.name.value);

      fields.push(getOperationFieldDefinition(`list${plurality(formattedTypeValue, this.improvePluralization)}`, [], nameListType, null));
    }

    return getTypeDefinition(fields, 'Query');
  }

  /**
   * Creates a GraphQL connection type for a given GraphQL type, corresponding to a SQL table name.
   *
   * @param tableName the name of the SQL table (and GraphQL type).
   * @returns a type definition node defining the connection type for the provided type name.
   */
  getConnectionType(tableName: string): ObjectTypeDefinitionNode {
    return getTypeDefinition(
      [getFieldDefinition('items', getNamedType(`[${tableName}]`)), getFieldDefinition('nextToken', getNamedType('String'))],
      `${tableName}Connection`,
    );
  }
}

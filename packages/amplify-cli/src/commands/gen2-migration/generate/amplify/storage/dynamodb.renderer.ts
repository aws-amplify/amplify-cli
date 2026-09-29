import ts from 'typescript';
import { newLineIdentifier, TS } from '../../ts';
import { STORAGE_DYNAMO_RESOURCES_TO_RETAIN } from '../../../_common/resource-types';

const factory = ts.factory;

/**
 * DynamoDB attribute definition.
 */
export interface DynamoDBAttribute {
  readonly name: string;
  readonly type: 'STRING' | 'NUMBER' | 'BINARY';
}

/**
 * DynamoDB Global Secondary Index definition.
 */
export interface DynamoDBGSI {
  readonly indexName: string;
  readonly partitionKey: DynamoDBAttribute;
  readonly sortKey?: DynamoDBAttribute;
}

/**
 * DynamoDB table definition extracted from AWS.
 */
export interface DynamoDBTableDefinition {
  readonly tableName: string;
  readonly partitionKey: DynamoDBAttribute;
  readonly sortKey?: DynamoDBAttribute;
  readonly gsis?: readonly DynamoDBGSI[];
  readonly billingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST';
  readonly readCapacity?: number;
  readonly writeCapacity?: number;
  readonly streamEnabled?: boolean;
  readonly streamViewType?: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES';
}

/**
 * Renders a complete storage/{name}/resource.ts file for a standalone
 * DynamoDB table. Produces `defineStorageXxx(backend)` and `postRefactor(table)`.
 * Pure — no AWS calls, no side effects.
 */
export class DynamoDBRenderer {
  private readonly resourceName: string;
  private readonly capitalizedName: string;
  private readonly functionName: string;

  public constructor(resourceName: string) {
    this.resourceName = resourceName;
    this.capitalizedName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
    this.functionName = `defineStorage${this.capitalizedName}`;
  }

  /**
   * Renders the complete resource.ts file.
   */
  public render(table: DynamoDBTableDefinition): ts.NodeArray<ts.Node> {
    return factory.createNodeArray([
      this.renderBackendTypeImport(),
      this.renderCdkImports(),
      this.renderCfnResourceImport(),
      newLineIdentifier,
      this.renderDefineStorage(table),
      newLineIdentifier,
      this.renderPostRefactor(table),
    ]);
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return TS.typeImport('../../backend', 'Backend');
  }

  private renderCdkImports(): ts.ImportDeclaration {
    return TS.namedImport('aws-cdk-lib/aws-dynamodb', 'Table', 'AttributeType', 'BillingMode', 'StreamViewType', 'CfnTable');
  }

  private renderCfnResourceImport(): ts.ImportDeclaration {
    return TS.namedImport('aws-cdk-lib', 'CfnResource');
  }

  private renderDefineStorage(table: DynamoDBTableDefinition): ts.FunctionDeclaration {
    const scopeVarName = `storage${this.capitalizedName}Stack`;
    const sanitizedName = sanitizeVariableName(table.tableName.replace(/-[^-]+$/, ''));
    const hasGSIs = table.gsis && table.gsis.length > 0;

    const bodyStatements: ts.Statement[] = [];

    bodyStatements.push(
      TS.declareConst(
        scopeVarName,
        factory.createCallExpression(TS.propAccess('backend', 'createStack') as ts.PropertyAccessExpression, undefined, [
          factory.createStringLiteral('storage' + this.resourceName),
        ]),
      ),
    );

    bodyStatements.push(...this.buildTableStatements(table, scopeVarName));

    bodyStatements.push(TS.retentionLoop(TS.propAccess(scopeVarName, 'node'), STORAGE_DYNAMO_RESOURCES_TO_RETAIN));

    if (hasGSIs) {
      bodyStatements.push(factory.createReturnStatement(factory.createIdentifier(sanitizedName)));
    }

    return TS.exportedFunction(this.functionName, bodyStatements);
  }

  private renderPostRefactor(table: DynamoDBTableDefinition): ts.FunctionDeclaration {
    const sanitizedName = sanitizeVariableName(table.tableName.replace(/-[^-]+$/, ''));

    const body = TS.castAssign(
      TS.propAccess(sanitizedName, 'node', 'defaultChild'),
      'CfnTable',
      'tableName',
      factory.createStringLiteral(table.tableName),
    );

    return factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      'postRefactor',
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, sanitizedName, undefined, factory.createTypeReferenceNode('Table'))],
      undefined,
      factory.createBlock([body], true),
    );
  }

  private buildTableStatements(table: DynamoDBTableDefinition, scopeVarName: string): ts.Statement[] {
    const statements: ts.Statement[] = [];
    const baseTableName = table.tableName.replace(/-[^-]+$/, '');
    const sanitizedName = sanitizeVariableName(baseTableName);

    const tableProps: ts.PropertyAssignment[] = [
      factory.createPropertyAssignment(
        'partitionKey',
        factory.createObjectLiteralExpression([
          TS.stringProp('name', table.partitionKey.name),
          TS.enumProp('type', 'AttributeType', table.partitionKey.type),
        ]),
      ),
      TS.enumProp('billingMode', 'BillingMode', table.billingMode || 'PROVISIONED'),
    ];

    if (table.billingMode !== 'PAY_PER_REQUEST') {
      tableProps.push(factory.createPropertyAssignment('readCapacity', factory.createNumericLiteral(String(table.readCapacity || 5))));
      tableProps.push(factory.createPropertyAssignment('writeCapacity', factory.createNumericLiteral(String(table.writeCapacity || 5))));
    }

    if (table.streamEnabled && table.streamViewType) {
      tableProps.push(TS.enumProp('stream', 'StreamViewType', table.streamViewType));
    }

    if (table.sortKey) {
      tableProps.push(
        factory.createPropertyAssignment(
          'sortKey',
          factory.createObjectLiteralExpression([
            TS.stringProp('name', table.sortKey.name),
            TS.enumProp('type', 'AttributeType', table.sortKey.type),
          ]),
        ),
      );
    }

    const hasGSIs = table.gsis && table.gsis.length > 0;

    if (hasGSIs) {
      statements.push(
        factory.createVariableStatement(
          [],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                sanitizedName,
                undefined,
                undefined,
                factory.createNewExpression(factory.createIdentifier('Table'), undefined, [
                  factory.createIdentifier(scopeVarName),
                  factory.createStringLiteral(sanitizedName),
                  factory.createObjectLiteralExpression(tableProps),
                ]),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
      );
    } else {
      statements.push(
        factory.createExpressionStatement(
          factory.createNewExpression(factory.createIdentifier('Table'), undefined, [
            factory.createIdentifier(scopeVarName),
            factory.createStringLiteral(sanitizedName),
            factory.createObjectLiteralExpression(tableProps),
          ]),
        ),
      );
    }

    if (table.gsis) {
      for (const gsi of table.gsis) {
        statements.push(this.renderGSI(sanitizedName, gsi));
      }
    }

    return statements;
  }

  private renderGSI(tableVarName: string, gsi: DynamoDBGSI): ts.Statement {
    const gsiProps: ts.PropertyAssignment[] = [
      TS.stringProp('indexName', gsi.indexName),
      factory.createPropertyAssignment(
        'partitionKey',
        factory.createObjectLiteralExpression([
          TS.stringProp('name', gsi.partitionKey.name),
          TS.enumProp('type', 'AttributeType', gsi.partitionKey.type),
        ]),
      ),
    ];

    if (gsi.sortKey) {
      gsiProps.push(
        factory.createPropertyAssignment(
          'sortKey',
          factory.createObjectLiteralExpression([
            TS.stringProp('name', gsi.sortKey.name),
            TS.enumProp('type', 'AttributeType', gsi.sortKey.type),
          ]),
        ),
      );
    }

    gsiProps.push(factory.createPropertyAssignment('readCapacity', factory.createNumericLiteral('5')));
    gsiProps.push(factory.createPropertyAssignment('writeCapacity', factory.createNumericLiteral('5')));

    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(tableVarName), factory.createIdentifier('addGlobalSecondaryIndex')),
        undefined,
        [factory.createObjectLiteralExpression(gsiProps)],
      ),
    );
  }
}

function sanitizeVariableName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_$]/g, '_');
}

import ts from 'typescript';

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
  readonly gsis?: DynamoDBGSI[];
  readonly billingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST';
  readonly readCapacity?: number;
  readonly writeCapacity?: number;
  readonly streamEnabled?: boolean;
  readonly streamViewType?: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES';
}

/**
 * Renders CDK Table constructs for DynamoDB resources in backend.ts.
 * Pure — no AWS calls, no side effects.
 */
export class DynamoDBRenderer {
  /**
   * Returns the CDK import identifiers needed for DynamoDB tables.
   */
  public requiredImports(): { readonly source: string; readonly identifiers: string[] } {
    return {
      source: 'aws-cdk-lib/aws-dynamodb',
      identifiers: ['Table', 'AttributeType', 'BillingMode', 'StreamViewType'],
    };
  }

  /**
   * Produces CDK Table construct statements for a single DynamoDB table.
   */
  public renderTable(table: DynamoDBTableDefinition): ts.Statement[] {
    const statements: ts.Statement[] = [];
    const baseTableName = table.tableName.replace(/-[^-]+$/, '');
    const sanitizedName = sanitizeVariableName(baseTableName);

    const tableProps: ts.PropertyAssignment[] = [
      factory.createPropertyAssignment(
        'partitionKey',
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment('name', factory.createStringLiteral(table.partitionKey.name)),
          factory.createPropertyAssignment(
            'type',
            factory.createPropertyAccessExpression(
              factory.createIdentifier('AttributeType'),
              factory.createIdentifier(table.partitionKey.type),
            ),
          ),
        ]),
      ),
      factory.createPropertyAssignment(
        'billingMode',
        factory.createPropertyAccessExpression(
          factory.createIdentifier('BillingMode'),
          factory.createIdentifier(table.billingMode || 'PROVISIONED'),
        ),
      ),
    ];

    if (table.billingMode !== 'PAY_PER_REQUEST') {
      tableProps.push(factory.createPropertyAssignment('readCapacity', factory.createNumericLiteral(String(table.readCapacity || 5))));
      tableProps.push(factory.createPropertyAssignment('writeCapacity', factory.createNumericLiteral(String(table.writeCapacity || 5))));
    }

    if (table.streamEnabled && table.streamViewType) {
      tableProps.push(
        factory.createPropertyAssignment(
          'stream',
          factory.createPropertyAccessExpression(
            factory.createIdentifier('StreamViewType'),
            factory.createIdentifier(table.streamViewType),
          ),
        ),
      );
    }

    if (table.sortKey) {
      tableProps.push(
        factory.createPropertyAssignment(
          'sortKey',
          factory.createObjectLiteralExpression([
            factory.createPropertyAssignment('name', factory.createStringLiteral(table.sortKey.name)),
            factory.createPropertyAssignment(
              'type',
              factory.createPropertyAccessExpression(
                factory.createIdentifier('AttributeType'),
                factory.createIdentifier(table.sortKey.type),
              ),
            ),
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
                  factory.createIdentifier('storageStack'),
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
            factory.createIdentifier('storageStack'),
            factory.createStringLiteral(sanitizedName),
            factory.createObjectLiteralExpression(tableProps),
          ]),
        ),
      );
    }

    // Table name comment
    const tableNameComment = factory.createNotEmittedStatement(factory.createStringLiteral(''));
    ts.addSyntheticLeadingComment(
      tableNameComment,
      ts.SyntaxKind.SingleLineCommentTrivia,
      ` Add this property to the Table above post refactor: tableName: '${table.tableName}'`,
      true,
    );
    statements.push(tableNameComment as unknown as ts.Statement);

    if (table.gsis) {
      for (const gsi of table.gsis) {
        statements.push(this.renderGSI(sanitizedName, gsi));
      }
    }

    return statements;
  }

  private renderGSI(tableVarName: string, gsi: DynamoDBGSI): ts.Statement {
    const gsiProps: ts.PropertyAssignment[] = [
      factory.createPropertyAssignment('indexName', factory.createStringLiteral(gsi.indexName)),
      factory.createPropertyAssignment(
        'partitionKey',
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment('name', factory.createStringLiteral(gsi.partitionKey.name)),
          factory.createPropertyAssignment(
            'type',
            factory.createPropertyAccessExpression(
              factory.createIdentifier('AttributeType'),
              factory.createIdentifier(gsi.partitionKey.type),
            ),
          ),
        ]),
      ),
    ];

    if (gsi.sortKey) {
      gsiProps.push(
        factory.createPropertyAssignment(
          'sortKey',
          factory.createObjectLiteralExpression([
            factory.createPropertyAssignment('name', factory.createStringLiteral(gsi.sortKey.name)),
            factory.createPropertyAssignment(
              'type',
              factory.createPropertyAccessExpression(factory.createIdentifier('AttributeType'), factory.createIdentifier(gsi.sortKey.type)),
            ),
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

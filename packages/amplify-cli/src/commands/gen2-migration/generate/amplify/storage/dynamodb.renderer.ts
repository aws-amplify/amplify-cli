import ts from 'typescript';
import { newLineIdentifier, TS } from '../../_infra/ts';

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
      newLineIdentifier,
      this.renderDefineStorage(table),
      newLineIdentifier,
      this.renderPostRefactor(table),
    ]);
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        true,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
      ),
      factory.createStringLiteral('../../backend'),
    );
  }

  private renderCdkImports(): ts.ImportDeclaration {
    const cdkImportSpecifiers = ['Table', 'AttributeType', 'BillingMode', 'StreamViewType', 'CfnTable'].map((id) =>
      factory.createImportSpecifier(false, undefined, factory.createIdentifier(id)),
    );
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, undefined, factory.createNamedImports(cdkImportSpecifiers)),
      factory.createStringLiteral('aws-cdk-lib/aws-dynamodb'),
    );
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

    if (hasGSIs) {
      bodyStatements.push(factory.createReturnStatement(factory.createIdentifier(sanitizedName)));
    }

    return factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      this.functionName,
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, 'backend', undefined, factory.createTypeReferenceNode('Backend'))],
      undefined,
      factory.createBlock(bodyStatements, true),
    );
  }

  private renderPostRefactor(table: DynamoDBTableDefinition): ts.FunctionDeclaration {
    const sanitizedName = sanitizeVariableName(table.tableName.replace(/-[^-]+$/, ''));

    const body = factory.createExpressionStatement(
      factory.createAssignment(
        factory.createPropertyAccessExpression(
          factory.createParenthesizedExpression(
            factory.createAsExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier(sanitizedName), factory.createIdentifier('node')),
                factory.createIdentifier('defaultChild'),
              ),
              factory.createTypeReferenceNode('CfnTable'),
            ),
          ),
          factory.createIdentifier('tableName'),
        ),
        factory.createStringLiteral(table.tableName),
      ),
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

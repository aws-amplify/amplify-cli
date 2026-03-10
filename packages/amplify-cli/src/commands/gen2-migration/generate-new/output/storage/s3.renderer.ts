import ts, { CallExpression } from 'typescript';
import { renderResourceTsFile } from '../../resource';
import { createBranchNameDeclaration } from '../../ts-factory-utils';

const factory = ts.factory;

/**
 * S3 access permission types.
 */
export type Permission = 'read' | 'write' | 'create' | 'delete';

/**
 * S3 trigger event types.
 */
export type StorageTriggerEvent = 'onDelete' | 'onUpload';

/**
 * Lambda trigger reference.
 */
export interface Lambda {
  readonly source: string;
}

/**
 * Access patterns for S3 storage.
 */
export interface AccessPatterns {
  readonly auth?: Permission[];
  readonly guest?: Permission[];
  readonly groups?: Record<string, Permission[]>;
  readonly functions?: ReadonlyArray<{
    readonly functionName: string;
    readonly permissions: Permission[];
  }>;
}

/**
 * Options for rendering a defineStorage() resource file.
 */
export interface RenderDefineStorageOptions {
  readonly storageIdentifier: string;
  readonly accessPatterns?: AccessPatterns;
  readonly triggers?: Partial<Record<StorageTriggerEvent, Lambda>>;
  readonly functionCategoryMap: ReadonlyMap<string, string>;
}

/**
 * Renders a defineStorage() resource.ts file from Gen1 S3 configuration.
 * Pure — no AWS calls, no side effects.
 */
export class S3Renderer {
  private readonly envName: string;

  public constructor(envName: string) {
    this.envName = envName;
  }

  /**
   * Produces the complete TypeScript AST for storage/resource.ts.
   */
  public async render(opts: RenderDefineStorageOptions): Promise<ts.NodeArray<ts.Node>> {
    const propertyAssignments: ts.PropertyAssignment[] = [];
    const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set(['defineStorage']) };
    const postImportStatements: ts.Node[] = [];

    const branchNameStatement = createBranchNameDeclaration();
    postImportStatements.push(branchNameStatement);

    this.renderName(propertyAssignments, opts.storageIdentifier);
    await this.renderAccessPatterns(propertyAssignments, namedImports, postImportStatements, opts);
    await this.renderTriggers(propertyAssignments, namedImports, opts);

    return renderResourceTsFile({
      backendFunctionConstruct: 'defineStorage',
      exportedVariableName: factory.createIdentifier('storage'),
      functionCallParameter: factory.createObjectLiteralExpression(propertyAssignments),
      postImportStatements,
      additionalImportedBackendIdentifiers: namedImports,
    });
  }

  private renderName(target: ts.PropertyAssignment[], storageIdentifier: string): void {
    const parts = storageIdentifier.split('-');
    const nameWithoutEnv = parts.slice(0, -1).join('-');
    const nameExpression = factory.createTemplateExpression(factory.createTemplateHead(`${nameWithoutEnv}-`), [
      factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
    ]);
    target.push(factory.createPropertyAssignment(factory.createIdentifier('name'), nameExpression));
  }

  private async renderAccessPatterns(
    target: ts.PropertyAssignment[],
    namedImports: Record<string, Set<string>>,
    postImportStatements: ts.Node[],
    opts: RenderDefineStorageOptions,
  ): Promise<void> {
    if (!opts.accessPatterns) return;

    target.push(this.buildAccessProperty(opts.accessPatterns));

    // Add function imports for function access patterns
    if (opts.accessPatterns.functions && opts.accessPatterns.functions.length > 0) {
      for (const functionAccess of opts.accessPatterns.functions) {
        const functionCategory = opts.functionCategoryMap.get(functionAccess.functionName) || 'function';
        const functionImportPath = `../${functionCategory}/${functionAccess.functionName}/resource`;
        if (!namedImports[functionImportPath]) {
          namedImports[functionImportPath] = new Set();
        }
        namedImports[functionImportPath].add(functionAccess.functionName);
      }
    }

    // Add group permissions TODO comment
    if (opts.accessPatterns.groups) {
      postImportStatements.push(
        factory.createJSDocComment(
          factory.createNodeArray([
            factory.createJSDocText('TODO: Your project uses group permissions. Group permissions have changed in Gen 2. '),
            factory.createJSDocText(
              'In order to grant permissions to groups in Gen 2, please refer to https://docs.amplify.aws/react/build-a-backend/storage/authorization/#for-gen-1-public-protected-and-private-access-pattern.',
            ),
          ]),
        ),
      );
    }
  }

  private async renderTriggers(
    target: ts.PropertyAssignment[],
    namedImports: Record<string, Set<string>>,
    opts: RenderDefineStorageOptions,
  ): Promise<void> {
    const triggers = opts.triggers;
    if (!triggers || Object.keys(triggers).length === 0) return;

    const triggerProps = Object.entries(triggers).map(([key, value]) => {
      const functionName = value.source.split('/')[3];
      return factory.createPropertyAssignment(factory.createIdentifier(key), factory.createIdentifier(functionName));
    });
    target.push(factory.createPropertyAssignment('triggers', factory.createObjectLiteralExpression(triggerProps, true)));

    for (const value of Object.values(triggers)) {
      const functionName = value.source.split('/')[3];
      const functionCategory = opts.functionCategoryMap.get(functionName) || 'function';
      const functionImportPath =
        functionCategory === 'storage' ? `./${functionName}/resource` : `../${functionCategory}/${functionName}/resource`;
      if (!namedImports[functionImportPath]) {
        namedImports[functionImportPath] = new Set();
      }
      namedImports[functionImportPath].add(functionName);
    }
  }

  private buildAccessProperty(accessPatterns: AccessPatterns): ts.PropertyAssignment {
    const allowIdentifier = factory.createIdentifier('allow');

    const publicPathAccess: CallExpression[] = [];
    const privatePathAccess: CallExpression[] = [];
    const protectedPathAccess: CallExpression[] = [];

    if (accessPatterns.guest && accessPatterns.guest.length > 0) {
      publicPathAccess.push(this.createAllowPattern(allowIdentifier, 'guest', accessPatterns.guest));
    }
    if (accessPatterns.auth && accessPatterns.auth.length > 0) {
      const pattern = this.createAllowPattern(allowIdentifier, 'authenticated', accessPatterns.auth);
      publicPathAccess.push(pattern);
      protectedPathAccess.push(pattern);
      privatePathAccess.push(pattern);
    }
    if (accessPatterns.groups) {
      for (const [groupName, permissions] of Object.entries(accessPatterns.groups)) {
        const pattern = this.createAllowPattern(allowIdentifier, `groups(['${groupName}'])`, permissions);
        publicPathAccess.push(pattern);
        privatePathAccess.push(pattern);
        protectedPathAccess.push(pattern);
      }
    }
    if (accessPatterns.functions && accessPatterns.functions.length > 0) {
      const consolidated: Record<string, Set<Permission>> = {};
      for (const { functionName, permissions } of accessPatterns.functions) {
        if (!consolidated[functionName]) {
          consolidated[functionName] = new Set(permissions);
        } else {
          for (const p of permissions) consolidated[functionName].add(p);
        }
      }
      for (const [functionName, permissions] of Object.entries(consolidated)) {
        const pattern = this.createResourcePattern(allowIdentifier, functionName, Array.from(permissions));
        publicPathAccess.push(pattern);
        privatePathAccess.push(pattern);
        protectedPathAccess.push(pattern);
      }
    }

    const allowAssignments: ts.PropertyAssignment[] = [];
    if (publicPathAccess.length > 0) {
      allowAssignments.push(
        factory.createPropertyAssignment(factory.createStringLiteral('public/*'), factory.createArrayLiteralExpression(publicPathAccess)),
      );
    }
    if (protectedPathAccess.length > 0) {
      allowAssignments.push(
        factory.createPropertyAssignment(
          factory.createStringLiteral('protected/{entity_id}/*'),
          factory.createArrayLiteralExpression(protectedPathAccess),
        ),
      );
    }
    if (privatePathAccess.length > 0) {
      allowAssignments.push(
        factory.createPropertyAssignment(
          factory.createStringLiteral('private/{entity_id}/*'),
          factory.createArrayLiteralExpression(privatePathAccess),
        ),
      );
    }

    const accessFunction = factory.createArrowFunction(
      undefined,
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, allowIdentifier)],
      undefined,
      undefined,
      factory.createParenthesizedExpression(factory.createObjectLiteralExpression(allowAssignments, true)),
    );
    return factory.createPropertyAssignment(factory.createIdentifier('access'), accessFunction);
  }

  private createAllowPattern(allowIdentifier: ts.Identifier, userLevel: string, permissions: Permission[]): CallExpression {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(allowIdentifier, factory.createIdentifier(`${userLevel}.to`)),
      undefined,
      [factory.createArrayLiteralExpression(permissions.map((p) => factory.createStringLiteral(p)))],
    );
  }

  private createResourcePattern(allowIdentifier: ts.Identifier, functionName: string, permissions: Permission[]): CallExpression {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(allowIdentifier, factory.createIdentifier('resource')),
          undefined,
          [factory.createIdentifier(functionName)],
        ),
        factory.createIdentifier('to'),
      ),
      undefined,
      [factory.createArrayLiteralExpression(permissions.map((p) => factory.createStringLiteral(p)))],
    );
  }
}

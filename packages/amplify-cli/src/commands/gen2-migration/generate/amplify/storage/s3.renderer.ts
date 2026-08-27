import ts, { CallExpression } from 'typescript';
import type { BucketAccelerateStatus, BucketVersioningStatus, ServerSideEncryptionConfiguration } from '@aws-sdk/client-s3';
import { newLineIdentifier, TS } from '../../ts';
import { STORAGE_S3_RESOURCES_TO_RETAIN } from '../../../_common/resource-types';

const factory = ts.factory;

/**
 * S3 access permission types.
 */
export type Permission = 'read' | 'write' | 'create' | 'delete';

/**
 * S3 trigger configuration.
 */
export interface StorageTriggers {
  readonly onUpload?: string;
  readonly onDelete?: string;
}

/**
 * A function's S3 access permissions.
 */
export interface FunctionAccess {
  readonly functionName: string;
  readonly permissions: readonly Permission[];
}

/**
 * Access patterns for S3 storage.
 */
export interface AccessPatterns {
  readonly auth?: readonly Permission[];
  readonly guest?: readonly Permission[];
  readonly groups?: Readonly<Record<string, readonly Permission[]>>;
  readonly functions?: readonly FunctionAccess[];
}

/**
 * Options for rendering a defineStorage() resource file.
 */
export interface S3RenderOptions {
  readonly name: string;
  readonly access?: AccessPatterns;
  readonly triggers?: StorageTriggers;
  readonly bucketName: string;
  readonly accelerateStatus?: BucketAccelerateStatus;
  readonly versioningStatus?: BucketVersioningStatus;
  readonly encryption?: ServerSideEncryptionConfiguration;
}

/**
 * Renders a complete storage/resource.ts file including defineStorage(),
 * postRefactor(), and applyEscapeHatches().
 * Pure — no AWS calls, no side effects.
 */
export class S3Renderer {
  /**
   * Produces the complete TypeScript AST for storage/resource.ts.
   */
  public render(opts: S3RenderOptions): ts.NodeArray<ts.Node> {
    const propertyAssignments: ts.PropertyAssignment[] = [];
    const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set(['defineStorage']) };
    const postImportStatements: ts.Node[] = [];

    postImportStatements.push(TS.createBranchNameDeclaration());

    this.renderName(propertyAssignments, opts.name);
    this.renderAccessPatterns(propertyAssignments, postImportStatements, opts);
    this.renderTriggers(propertyAssignments, namedImports, opts);

    const nodes: ts.Node[] = [
      ...this.renderImportStatements(namedImports),
      TS.namedImport('aws-cdk-lib', 'CfnResource'),
      this.renderBackendTypeImport(),
      newLineIdentifier,
      ...postImportStatements,
      newLineIdentifier,
      this.renderDefineStorageExport(propertyAssignments),
      newLineIdentifier,
      this.renderPostRefactor(opts.bucketName),
      newLineIdentifier,
      this.renderApplyEscapeHatches(opts),
    ];

    return factory.createNodeArray(nodes);
  }

  private renderImportStatements(namedImports: Readonly<Record<string, Set<string>>>): ts.ImportDeclaration[] {
    const imports: ts.ImportDeclaration[] = [];
    for (const [source, identifiers] of Object.entries(namedImports)) {
      imports.push(TS.namedImport(source, ...Array.from(identifiers)));
    }
    return imports;
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return TS.typeImport('../backend', 'Backend');
  }

  private renderDefineStorageExport(propertyAssignments: ts.PropertyAssignment[]): ts.VariableStatement {
    return factory.createVariableStatement(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'storage',
            undefined,
            undefined,
            factory.createCallExpression(factory.createIdentifier('defineStorage'), undefined, [
              factory.createObjectLiteralExpression(propertyAssignments),
            ]),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
  }

  private renderPostRefactor(bucketName: string): ts.FunctionDeclaration {
    const s3BucketDeclaration = this.createCfnBucketDeclaration();
    const assignment = factory.createExpressionStatement(
      factory.createAssignment(
        factory.createPropertyAccessExpression(factory.createIdentifier('s3Bucket'), factory.createIdentifier('bucketName')),
        factory.createStringLiteral(bucketName),
      ),
    );
    return TS.exportedFunction('postRefactor', [s3BucketDeclaration, assignment]);
  }

  private renderApplyEscapeHatches(opts: S3RenderOptions): ts.FunctionDeclaration {
    const statements: ts.Statement[] = [this.createCfnBucketDeclaration()];

    if (opts.accelerateStatus) {
      statements.push(
        factory.createExpressionStatement(
          factory.createAssignment(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('s3Bucket'),
              factory.createIdentifier('accelerateConfiguration'),
            ),
            factory.createObjectLiteralExpression([TS.stringProp('accelerationStatus', opts.accelerateStatus)]),
          ),
        ),
      );
    }

    if (opts.versioningStatus) {
      statements.push(
        factory.createExpressionStatement(
          factory.createAssignment(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('s3Bucket'),
              factory.createIdentifier('versioningConfiguration'),
            ),
            factory.createObjectLiteralExpression([TS.stringProp('status', opts.versioningStatus)]),
          ),
        ),
      );
    }

    if (opts.encryption?.Rules?.[0]) {
      statements.push(this.renderEncryption(opts.encryption.Rules[0]));
    }

    statements.push(TS.retentionLoop(TS.propAccess('backend', 'storage', 'stack', 'node'), STORAGE_S3_RESOURCES_TO_RETAIN));

    return TS.exportedFunction('applyEscapeHatches', statements);
  }

  private renderEncryption(rule: NonNullable<ServerSideEncryptionConfiguration['Rules']>[0]): ts.ExpressionStatement {
    const sseProps: ts.PropertyAssignment[] = [];
    if (rule.ApplyServerSideEncryptionByDefault) {
      const sseDefaultProps: ts.PropertyAssignment[] = [];
      if (rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm) {
        sseDefaultProps.push(TS.stringProp('sseAlgorithm', rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm));
      }
      if (rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID) {
        sseDefaultProps.push(TS.stringProp('kmsMasterKeyId', rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID));
      }
      sseProps.push(
        factory.createPropertyAssignment('serverSideEncryptionByDefault', factory.createObjectLiteralExpression(sseDefaultProps, true)),
      );
    }
    if (rule.BucketKeyEnabled !== undefined) {
      sseProps.push(
        factory.createPropertyAssignment('bucketKeyEnabled', rule.BucketKeyEnabled ? factory.createTrue() : factory.createFalse()),
      );
    }
    return factory.createExpressionStatement(
      factory.createAssignment(
        factory.createPropertyAccessExpression(factory.createIdentifier('s3Bucket'), factory.createIdentifier('bucketEncryption')),
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(
              'serverSideEncryptionConfiguration',
              factory.createArrayLiteralExpression([factory.createObjectLiteralExpression(sseProps, true)], true),
            ),
          ],
          true,
        ),
      ),
    );
  }

  /** Creates `const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;` */
  private createCfnBucketDeclaration(): ts.VariableStatement {
    return TS.declareConst('s3Bucket', TS.propAccess('backend', 'storage', 'resources', 'cfnResources', 'cfnBucket'));
  }

  private renderName(target: ts.PropertyAssignment[], storageIdentifier: string): void {
    const parts = storageIdentifier.split('-');
    const nameWithoutEnv = parts.slice(0, -1).join('-');
    const nameExpression = factory.createTemplateExpression(factory.createTemplateHead(`${nameWithoutEnv}-`), [
      factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
    ]);
    target.push(factory.createPropertyAssignment(factory.createIdentifier('name'), nameExpression));
  }

  private renderAccessPatterns(target: ts.PropertyAssignment[], postImportStatements: ts.Node[], opts: S3RenderOptions): void {
    if (!opts.access) return;

    // Only emit the `access` block for identity-based (guest/authenticated/group)
    // access. Function access is emitted as forward-direction grants in backend.ts
    // (see buildFunctionAccessBackendStatements), so a bucket whose only Gen1
    // access was function access produces no `access` block here.
    const hasIdentityAccess =
      (opts.access.guest?.length ?? 0) > 0 ||
      (opts.access.auth?.length ?? 0) > 0 ||
      (opts.access.groups !== undefined && Object.keys(opts.access.groups).length > 0);

    if (hasIdentityAccess) {
      target.push(this.buildAccessProperty(opts.access));
    }

    if (opts.access.groups) {
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

  private renderTriggers(target: ts.PropertyAssignment[], namedImports: Record<string, Set<string>>, opts: S3RenderOptions): void {
    const triggers = opts.triggers;
    if (!triggers || Object.keys(triggers).length === 0) return;

    const triggerProps = Object.entries(triggers).map(([key, functionName]) => {
      return factory.createPropertyAssignment(factory.createIdentifier(key), factory.createIdentifier(functionName));
    });
    target.push(factory.createPropertyAssignment('triggers', factory.createObjectLiteralExpression(triggerProps, true)));

    for (const functionName of Object.values(triggers)) {
      const functionImportPath = `../function/${functionName}/resource`;
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
      publicPathAccess.push(S3Renderer.createAllowPattern(allowIdentifier, 'guest', accessPatterns.guest));
    }
    if (accessPatterns.auth && accessPatterns.auth.length > 0) {
      // Gen1 authenticated access maps per path:
      // - public/* is shared: authenticated users get the Gen1 auth permission set.
      // - private/ and protected/ are per-user: use allow.entity('identity') so {entity_id}
      //   resolves to the caller's own Cognito identity, matching the Gen1 per-user scoping.
      // - protected/ additionally grants authenticated read (Gen1 cross-user read). When the
      //   auth set is read-only this subsumes the owner's entity read; the overlap is harmless
      //   and keeps the per-path mapping uniform across permission sets.
      publicPathAccess.push(S3Renderer.createAllowPattern(allowIdentifier, 'authenticated', accessPatterns.auth));
      privatePathAccess.push(S3Renderer.createEntityPattern(allowIdentifier, accessPatterns.auth));
      protectedPathAccess.push(S3Renderer.createEntityPattern(allowIdentifier, accessPatterns.auth));
      protectedPathAccess.push(S3Renderer.createAllowPattern(allowIdentifier, 'authenticated', ['read']));
    }
    if (accessPatterns.groups) {
      for (const [groupName, permissions] of Object.entries(accessPatterns.groups)) {
        const pattern = S3Renderer.createAllowPattern(allowIdentifier, `groups(['${groupName}'])`, permissions);
        publicPathAccess.push(pattern);
        privatePathAccess.push(pattern);
        protectedPathAccess.push(pattern);
      }
    }
    // NOTE: function access is intentionally NOT emitted here as
    // `allow.resource(fn).to([...])` entries in the per-path access map. That
    // construct makes the storage stack reference the function's role, i.e. a
    // `storage -> function` cross-stack dependency, which combined with the
    // function's own grants to other categories closes a cross-stack cycle and
    // produces a CloudformationStackCircularDependencyError on deploy. Function
    // access is instead emitted in backend.ts as forward-direction CDK grants on
    // the bucket construct (see buildFunctionAccessBackendStatements), preserving
    // the `function -> storage` direction. Guest / authenticated / group access
    // below is per-path and stays in the access block.

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

  private static createAllowPattern(allowIdentifier: ts.Identifier, userLevel: string, permissions: readonly Permission[]): CallExpression {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(allowIdentifier, factory.createIdentifier(`${userLevel}.to`)),
      undefined,
      [factory.createArrayLiteralExpression(permissions.map((p) => factory.createStringLiteral(p)))],
    );
  }

  // Renders `allow.entity('identity').to([...])`, which scopes an {entity_id} path to the
  // caller's own Cognito identity in the generated IAM policy.
  private static createEntityPattern(allowIdentifier: ts.Identifier, permissions: readonly Permission[]): CallExpression {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(allowIdentifier, factory.createIdentifier('entity')),
          undefined,
          [factory.createStringLiteral('identity')],
        ),
        factory.createIdentifier('to'),
      ),
      undefined,
      [factory.createArrayLiteralExpression(permissions.map((p) => factory.createStringLiteral(p)))],
    );
  }

  /**
   * Builds the forward-direction function->storage grant statements emitted into
   * backend.ts (not into storage/resource.ts).
   *
   * Each granted function is wired with a CDK grant on the underlying bucket:
   *
   *   backend.storage.resources.bucket.grantReadWrite(backend.<fn>.resources.lambda);
   *
   * The grant adds the IAM policy to the FUNCTION's role and references the
   * bucket ARN, so the cross-stack dependency stays `function -> storage`. It
   * replaces the previous `allow.resource(fn).to([...])` entries in the
   * defineStorage access block, which pointed the dependency the other way
   * (`storage -> function`) and caused deploy-time circular dependencies when the
   * same function also accessed auth/data.
   *
   * S3 permissions map to the narrowest CDK grant that covers them:
   *   read                    -> grantRead
   *   write/create            -> grantWrite
   *   delete                  -> grantDelete
   *   read + write/create     -> grantReadWrite
   * Any combination that includes delete additionally emits grantDelete, since
   * there is no single CDK method covering read+write+delete.
   *
   * Returns one or more statement strings per granted function (permissions
   * consolidated across duplicate entries), or an empty array when there is
   * nothing to grant. The caller passes these to
   * BackendGenerator.addPostDefineBackendStatement.
   */
  public buildFunctionAccessBackendStatements(functions: readonly FunctionAccess[] | undefined): string[] {
    if (!functions || functions.length === 0) {
      return [];
    }

    // Consolidate permissions per function (a function may appear more than once).
    const permsByFunction: Record<string, Set<Permission>> = {};
    for (const { functionName, permissions } of functions) {
      if (!permsByFunction[functionName]) {
        permsByFunction[functionName] = new Set();
      }
      for (const p of permissions) {
        permsByFunction[functionName].add(p);
      }
    }

    const statements: string[] = [];
    for (const [functionName, permSet] of Object.entries(permsByFunction)) {
      const lambda = `backend.${functionName}.resources.lambda`;
      const grantee = `backend.storage.resources.bucket`;
      const canRead = permSet.has('read');
      const canWrite = permSet.has('write') || permSet.has('create');
      const canDelete = permSet.has('delete');

      if (canRead && canWrite) {
        statements.push(`${grantee}.grantReadWrite(${lambda});`);
      } else if (canRead) {
        statements.push(`${grantee}.grantRead(${lambda});`);
      } else if (canWrite) {
        statements.push(`${grantee}.grantWrite(${lambda});`);
      }
      if (canDelete) {
        statements.push(`${grantee}.grantDelete(${lambda});`);
      }
    }
    return statements;
  }
}

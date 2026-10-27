import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { TS } from '../../ts';
import { AuthRenderOptions, AuthRenderer, AuthTrigger, FunctionAccess } from './auth.renderer';
import { SpinningLogger } from '../../../_common/spinning-logger';

/**
 * Generates auth resource files and contributes to backend.ts.
 *
 * Reads the Gen1 Cognito configuration and generates
 * amplify/auth/resource.ts with defineAuth() + applyEscapeHatches().
 * Contributes namespace import, defineBackend entry, and
 * applyEscapeHatches call to backend.ts.
 */
export class AuthGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly defineAuth: AuthRenderer;
  private readonly access: FunctionAccess[] = [];
  private readonly triggers: AuthTrigger[] = [];
  private readonly functionsWithStorageOrDataAccess = new Set<string>();
  private readonly logger: SpinningLogger;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    outputDir: string,
    resource: DiscoveredResource,
    logger: SpinningLogger,
  ) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resource = resource;
    this.defineAuth = new AuthRenderer();
    this.logger = logger;
  }

  /** Registers a function's auth access permissions. */
  public addFunctionAuthAccess(access: FunctionAccess): void {
    this.access.push(access);
  }

  public addTrigger(trigger: AuthTrigger): void {
    this.triggers.push(trigger);
  }

  /**
   * Records that a function also has storage and/or data (DynamoDB/@model)
   * access. Used only to warn when such a function is ALSO an auth trigger: the
   * trigger edge (auth -> function) combined with function -> storage (the
   * generated addToRolePolicy grant plus the `addEnvironment(..., bucket.bucketName)`
   * escape hatch) and storage -> auth (identity access on the bucket) can close a
   * deploy-time circular dependency that the auth-grant partition alone cannot
   * break. Called by the function generator, which is the per-function authority
   * on cross-category access.
   */
  public markFunctionHasStorageOrDataAccess(resourceName: string): void {
    this.functionsWithStorageOrDataAccess.add(resourceName);
  }

  private readGen1UserPoolSchema(): Record<string, unknown>[] | undefined {
    const name = this.resource.resourceName;
    const templatePath = `auth/${name}/build/${name}-cloudformation-template.json`;
    if (!this.gen1App.fileExists(templatePath)) return undefined;
    const schema = this.gen1App.json(templatePath)?.Resources?.UserPool?.Properties?.Schema;
    return Array.isArray(schema) && schema.length > 0 ? schema : undefined;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const userPoolId = this.gen1App.resourceMetaOutput(this.resource, 'UserPoolId');
    const userPool = await this.gen1App.aws.fetchUserPool(userPoolId);

    const appClientIdWeb = this.gen1App.resourceMetaOutput(this.resource, 'AppClientIDWeb');
    const appClientIdNative = this.gen1App.resourceMetaOutput(this.resource, 'AppClientID');
    const identityPoolId = this.gen1App.tryResourceMetaOutput(this.resource, 'IdentityPoolId');

    this.logger.debug(`Fetching auth resources for user pool '${userPoolId}'`);
    const [mfaConfig, webClient, nativeClient, identityProviders, identityGroups, identityPool] = await Promise.all([
      this.gen1App.aws.fetchMfaConfig(userPoolId),
      this.gen1App.aws.fetchUserPoolClient(userPoolId, appClientIdWeb),
      this.gen1App.aws.fetchUserPoolClient(userPoolId, appClientIdNative),
      this.gen1App.aws.fetchIdentityProviders(userPoolId),
      this.gen1App.aws.fetchIdentityGroups(userPoolId),
      identityPoolId ? this.gen1App.aws.fetchIdentityPool(identityPoolId) : Promise.resolve(undefined),
    ]);

    const renderOptions: AuthRenderOptions = {
      userPool,
      identityPool,
      identityProviders,
      identityGroups,
      webClient,
      mfaConfig,
      nativeClient,
      triggers: this.triggers,
      // `access` is set inside execute() from the trigger subset (see below):
      // the partition must run AFTER the function generators have populated
      // this.access / this.triggers, which happens after plan() returns.
      gen1UserPoolSchema: this.readGen1UserPoolSchema(),
    };

    const authDir = path.join(this.outputDir, 'amplify', 'auth');

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Generate amplify/auth/resource.ts'],
        execute: async () => {
          this.logger.info('Rendering auth/resource.ts');

          // Validate every interpolated resource/function identifier ONCE, before
          // auth/resource.ts is written. Both the trigger-access path (the
          // defineAuth `access` block) and the non-trigger path (the backend.ts
          // grant) interpolate these names verbatim into generated TypeScript, so
          // an invalid name (hyphen/dot/space) must fail loudly here rather than
          // emit a file that will not compile. The renderer and grant builder each
          // re-assert for the subset they touch; this up-front pass guarantees the
          // trigger path is covered too.
          for (const name of [...this.access.map((a) => a.resourceName), ...this.triggers.map((t) => t.resourceName)]) {
            TS.assertValidIdentifier(name, `auth function access/trigger '${name}'`);
          }

          // Partition function auth access by whether the function is ALSO an auth
          // trigger. Computed HERE (not in plan()) because the function generators
          // populate this.access / this.triggers after this.plan() returns. A
          // trigger already forces an `auth -> function` cross-stack edge, so its
          // access must ride the defineAuth `access` block (Amplify co-locates it,
          // adding no new edge); a forward backend.ts userPool.grant on a trigger
          // function would add a `function -> auth` edge and close a circular
          // dependency at deploy time. Non-trigger access uses the forward grant.
          const triggerResourceNames = new Set(this.triggers.map((t) => t.resourceName));
          const triggerAccess = this.access.filter((a) => triggerResourceNames.has(a.resourceName));
          const nonTriggerAccess = this.access.filter((a) => !triggerResourceNames.has(a.resourceName));

          // Warn when a trigger function ALSO accesses storage/data. The auth-grant
          // partition keeps the auth edge safe, but it cannot break the independent
          // cycle auth -> function (trigger) -> storage (grant + addEnvironment
          // escape hatch) -> auth (identity access). Surface it so the operator can
          // verify the deploy rather than hit a circular-dependency error.
          const triggersWithStorageOrData = this.triggers
            .map((t) => t.resourceName)
            .filter((name) => this.functionsWithStorageOrDataAccess.has(name));
          if (triggersWithStorageOrData.length > 0) {
            this.logger.warn(
              `Auth trigger function(s) [${triggersWithStorageOrData.join(
                ', ',
              )}] also access storage or data. The trigger edge plus the function's storage/data grants can form a cross-stack circular dependency at deploy time; verify the generated amplify/backend.ts deploys (e.g. with 'cdk synth') before relying on it.`,
            );
          }

          const nodeArray = this.defineAuth.render({ ...renderOptions, access: triggerAccess });
          const content = TS.printNodes(nodeArray);

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addNamespaceImport('auth', './auth/resource');
          this.backendGenerator.addDefineBackendEntry('auth', 'auth', 'auth');
          this.backendGenerator.addApplyEscapeHatchesCall({ alias: 'auth', extraArgs: [] });

          /**
           * Emit non-trigger function -> auth access as forward-direction grants
           * in backend.ts (`backend.auth.resources.userPool.grant(...)`). Trigger
           * functions are handled via the defineAuth `access` block instead (see
           * the partition above), because a forward grant on a trigger function
           * would close a circular dependency at deploy time.
           */
          // Warn over ALL registered access (trigger and non-trigger alike): an
          // unmapped Gen1 permission is emitted as a raw cognito-idp action on
          // whichever path it takes, so the operator must be able to verify it
          // regardless of whether the function is a trigger.
          const unknownPermissions = AuthRenderer.unknownPermissions(this.access);
          if (unknownPermissions.length > 0) {
            this.logger.warn(
              `Unrecognized Gen1 auth permission(s) [${unknownPermissions.join(
                ', ',
              )}] have no known cognito-idp action mapping and were emitted as raw 'cognito-idp:<permission>' actions. Verify the generated IAM actions in amplify/backend.ts.`,
            );
          }
          for (const statement of this.defineAuth.buildFunctionAccessBackendStatements(nonTriggerAccess)) {
            this.backendGenerator.addPostDefineBackendStatement(statement);
          }

          if (userPool.Domain) {
            this.backendGenerator.addPostRefactorCall('auth.postRefactor(backend)');
          }
        },
      },
    ];
  }
}

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

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const userPoolId = this.gen1App.resourceMetaOutput(this.resource, 'UserPoolId');
    const userPool = await this.gen1App.aws.fetchUserPool(userPoolId);

    const appClientIdWeb = this.gen1App.resourceMetaOutput(this.resource, 'AppClientIDWeb');
    const appClientIdNative = this.gen1App.resourceMetaOutput(this.resource, 'AppClientID');
    const identityPoolId = this.gen1App.resourceMetaOutput(this.resource, 'IdentityPoolId');

    this.logger.debug(`Fetching auth resources for user pool '${userPoolId}'`);
    const [mfaConfig, webClient, nativeClient, identityProviders, identityGroups, identityPool] = await Promise.all([
      this.gen1App.aws.fetchMfaConfig(userPoolId),
      this.gen1App.aws.fetchUserPoolClient(userPoolId, appClientIdWeb),
      this.gen1App.aws.fetchUserPoolClient(userPoolId, appClientIdNative),
      this.gen1App.aws.fetchIdentityProviders(userPoolId),
      this.gen1App.aws.fetchIdentityGroups(userPoolId),
      this.gen1App.aws.fetchIdentityPool(identityPoolId),
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
      access: this.access,
    };

    const authDir = path.join(this.outputDir, 'amplify', 'auth');

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Generate amplify/auth/resource.ts'],
        execute: async () => {
          this.logger.info('Rendering auth/resource.ts');
          const nodeArray = this.defineAuth.render(renderOptions);
          let content = TS.printNodes(nodeArray);

          content = content.replace(/\(allow, _unused\)/g, '(allow)');

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addNamespaceImport('auth', './auth/resource');
          this.backendGenerator.addDefineBackendEntry('auth', 'auth', 'auth');
          this.backendGenerator.addApplyEscapeHatchesCall({ alias: 'auth', extraArgs: [] });
          if (userPool.Domain) {
            this.backendGenerator.addPostRefactorCall('auth.postRefactor(backend)');
          }
        },
      },
    ];
  }
}

import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../../_infra/planner';
import { AmplifyMigrationOperation } from '../../../_infra/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../_infra/gen1-app';
import { TS } from '../../_infra/ts';
import { AuthRenderOptions, AuthRenderer, AuthTrigger, FunctionAccess } from './auth.renderer';

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

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string, resource: DiscoveredResource) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resource = resource;
    this.defineAuth = new AuthRenderer();
  }

  /** Registers a function's auth access permissions. */
  public addFunctionAuthAccess(access: FunctionAccess): void {
    this.access.push(access);
  }

  public addTrigger(trigger: AuthTrigger): void {
    this.triggers.push(trigger);
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const authResourceName = this.gen1App.singleResourceName('auth', 'Cognito');
    const userPoolId = this.gen1App.resourceMetaOutput(this.resource, 'UserPoolId');
    const userPool = await this.gen1App.aws.fetchUserPool(userPoolId);

    const appClientIdWeb = this.gen1App.resourceMetaOutput(this.resource, 'AppClientIDWeb');
    const appClientId = this.gen1App.resourceMetaOutput(this.resource, 'AppClientID');
    const identityPoolId = this.gen1App.resourceMetaOutput(this.resource, 'IdentityPoolId');

    const [mfaConfig, webClient, userPoolClient, identityProviders, identityGroups, identityPool] = await Promise.all([
      this.gen1App.aws.fetchMfaConfig(userPoolId),
      appClientIdWeb ? this.gen1App.aws.fetchUserPoolClient(userPoolId, appClientIdWeb) : Promise.resolve(undefined),
      appClientId ? this.gen1App.aws.fetchUserPoolClient(userPoolId, appClientId) : Promise.resolve(undefined),
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
      userPoolClient,
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
          const nodeArray = this.defineAuth.render(renderOptions);
          let content = TS.printNodes(nodeArray);

          content = content.replace(/\(allow, _unused\)/g, '(allow: any)');

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addNamespaceImport('auth', './auth/resource');
          this.backendGenerator.addDefineBackendEntry('auth', 'auth', 'auth');
          this.backendGenerator.addApplyEscapeHatchesCall({ alias: 'auth', extraArgs: [] });
        },
      },
    ];
  }
}

import path from 'node:path';
import fs from 'node:fs/promises';
import { AmplifyError, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { TS } from '../../ts';
import { ReferenceAuth, ReferenceAuthRenderer } from './reference-auth.renderer';
import { SpinningLogger } from '../../../_common/spinning-logger';

/**
 * Generates auth resource files for imported (reference) auth resources.
 * Produces a referenceAuth() call in resource.ts and contributes the
 * auth import to backend.ts.
 */
export class ReferenceAuthGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly renderer = new ReferenceAuthRenderer();
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
    this.logger = logger;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const authCategory = this.gen1App.categoryMeta('auth');
    if (!authCategory) {
      throw new AmplifyFault('AuthCategoryFault', {
        message: 'Auth category not found in amplify-meta.json — ReferenceAuthGenerator should only be created when auth exists',
      });
    }

    const referenceAuth = await this.buildReferenceAuth(authCategory);
    if (!referenceAuth) {
      throw new AmplifyFault('AuthCategoryFault', {
        message:
          'Auth category exists but no imported auth resource found — ReferenceAuthGenerator should only be created for imported auth',
      });
    }

    const authDir = path.join(this.outputDir, 'amplify', 'auth');

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Generate amplify/auth/resource.ts (reference auth)'],
        execute: async () => {
          this.logger.info('Rendering auth/resource.ts (reference auth)');
          const nodes = this.renderer.render(referenceAuth);
          const content = TS.printNodes(nodes);

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addNamespaceImport('auth', './auth/resource');
          this.backendGenerator.addDefineBackendEntry('auth', 'auth', 'auth');
        },
      },
    ];
  }

  private async buildReferenceAuth(authCategory: Record<string, unknown>): Promise<ReferenceAuth | undefined> {
    const isImported = Object.values(authCategory).some(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        'serviceType' in value &&
        (value as Record<string, unknown>).serviceType === 'imported',
    );
    if (!isImported) return undefined;

    const firstAuth = Object.values(authCategory)[0] as Record<string, unknown>;
    const output = firstAuth?.output as Record<string, string> | undefined;
    const userPoolId = output?.UserPoolId;
    const userPoolClientId = output?.AppClientIDWeb;
    const identityPoolId = output?.IdentityPoolId;

    if (!userPoolId && !userPoolClientId && !identityPoolId) {
      throw new AmplifyError('AuthImportError', {
        message: 'No user pool or identity pool found for import.',
        resolution: 'Verify the imported auth resource has valid User Pool or Identity Pool configuration in amplify-meta.json.',
      });
    }

    let roles: { authenticated?: string; unauthenticated?: string } | undefined;
    if (identityPoolId) {
      this.logger.debug(`Fetching identity pool roles for '${identityPoolId}'`);
      roles = await this.gen1App.aws.fetchIdentityPoolRoles(identityPoolId);
    }
    let groups: Record<string, string> | undefined;
    if (userPoolId) {
      this.logger.debug(`Fetching user pool groups for '${userPoolId}'`);
      groups = await this.gen1App.aws.fetchGroupsByUserPoolId(userPoolId);
    }

    return {
      userPoolId,
      userPoolClientId,
      identityPoolId,
      unauthRoleArn: roles?.unauthenticated,
      authRoleArn: roles?.authenticated,
      groups,
    };
  }
}

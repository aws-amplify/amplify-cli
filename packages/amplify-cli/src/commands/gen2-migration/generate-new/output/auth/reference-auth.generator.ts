import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { printNodes } from '../../ts-writer';
import { ReferenceAuth, ReferenceAuthRenderer } from './reference-auth.renderer';

const factory = ts.factory;

/**
 * Generates auth resource files for imported (reference) auth resources.
 * Produces a referenceAuth() call in resource.ts and contributes the
 * auth import to backend.ts.
 */
export class ReferenceAuthGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly renderer = new ReferenceAuthRenderer();

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const authCategory = this.gen1App.meta('auth');
    if (!authCategory) return [];

    const referenceAuth = await this.buildReferenceAuth(authCategory);
    if (!referenceAuth) return [];

    const authDir = path.join(this.outputDir, 'amplify', 'auth');

    return [
      {
        describe: async () => ['Generate amplify/auth/resource.ts (reference auth)'],
        execute: async () => {
          const nodes = this.renderer.render(referenceAuth);
          const content = printNodes(nodes);

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addImport('./auth/resource', ['auth']);
          this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier('auth')));
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
      throw new Error('No user pool or identity pool found for import.');
    }

    const roles = identityPoolId ? await this.gen1App.aws.fetchIdentityPoolRoles(identityPoolId) : undefined;
    const groups = userPoolId ? await this.gen1App.aws.fetchGroupsByUserPoolId(userPoolId) : undefined;

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

import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../gen1-app/gen1-app';
import { printNodes } from '../ts-writer';

import { AuthDefinition, renderAuthNode } from './render-auth';
import { getAuthDefinition } from './auth-adapter';
import { FunctionDefinition } from './function-types';

const factory = ts.factory;

/**
 * Generates auth resource files and contributes to backend.ts.
 *
 * Reads the Gen1 Cognito configuration (user pool, identity pool,
 * identity providers, MFA, groups, triggers) and generates
 * amplify/auth/resource.ts with a defineAuth() call. Also contributes
 * auth imports and CDK overrides (password policy, user pool client
 * settings, identity pool config) to backend.ts.
 */
export class AuthGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly functions: FunctionDefinition[] | undefined;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string, functions?: FunctionDefinition[]) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.functions = functions;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const authCategory = await this.gen1App.fetchMetaCategory('auth');
    if (!authCategory) {
      return [];
    }

    // Check for reference auth (imported resources)
    const referenceAuth = await this.buildReferenceAuth(authCategory);
    if (referenceAuth) {
      return this.planReferenceAuth(referenceAuth);
    }

    // Standard auth: fetch all Cognito resources
    const resources = await this.gen1App.fetchResourcesByLogicalId();
    const userPool = await this.gen1App.aws.fetchUserPool(resources);
    if (!userPool) {
      return [];
    }

    const [mfaConfig, webClient, userPoolClient, identityProviders, identityGroups, identityPool, authTriggerConnections] =
      await Promise.all([
        this.gen1App.aws.fetchMfaConfig(resources),
        this.gen1App.aws.fetchWebClient(resources),
        this.gen1App.aws.fetchUserPoolClient(resources),
        this.gen1App.aws.fetchIdentityProviders(resources),
        this.gen1App.aws.fetchIdentityGroups(resources),
        this.gen1App.aws.fetchIdentityPool(resources),
        this.gen1App.fetchAuthTriggerConnections(),
      ]);

    // Build the AuthDefinition using the existing adapter
    const authDefinition = getAuthDefinition({
      userPool,
      identityPoolName: identityPool?.identityPoolName,
      identityProviders: identityProviders.map((p) => ({
        ProviderName: p.ProviderName,
        ProviderType: p.ProviderType,
        CreationDate: p.CreationDate,
        LastModifiedDate: p.LastModifiedDate,
      })),
      identityProvidersDetails: identityProviders,
      identityGroups,
      webClient,
      authTriggerConnections,
      guestLogin: identityPool?.guestLogin,
      mfaConfig: mfaConfig?.mfaConfig,
      totpConfig: mfaConfig?.totpConfig,
      userPoolClient,
    });

    return this.planStandardAuth(authDefinition);
  }

  private planReferenceAuth(authDefinition: AuthDefinition): AmplifyMigrationOperation[] {
    const authDir = path.join(this.outputDir, 'amplify', 'auth');

    return [
      {
        describe: async () => ['Generate auth/resource.ts (reference auth)'],
        execute: async () => {
          const nodes = renderAuthNode(authDefinition, this.functions, new Map());
          const content = printNodes(nodes);

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.contributeToBackend(authDefinition);
        },
      },
    ];
  }

  private planStandardAuth(authDefinition: AuthDefinition): AmplifyMigrationOperation[] {
    const authDir = path.join(this.outputDir, 'amplify', 'auth');

    // Build function category map for correct import paths in resource.ts
    const functionCategories = new Map<string, string>();
    if (this.functions) {
      for (const func of this.functions) {
        if (func.resourceName && func.category) {
          functionCategories.set(func.resourceName, func.category);
        }
      }
    }

    return [
      {
        describe: async () => ['Generate auth/resource.ts'],
        execute: async () => {
          const nodes = renderAuthNode(authDefinition, this.functions, functionCategories);
          let content = printNodes(nodes);

          // Post-process: fix generated code patterns
          content = content.replace(/\(allow, _unused\)/g, '(allow: any)');
          content = content.replace(/(access: \(allow: any\) => \[[\s\S]*?\n {4}\])/g, '$1,');

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.contributeToBackend(authDefinition);
        },
      },
    ];
  }

  /**
   * Adds auth imports and CDK overrides to backend.ts.
   */
  private contributeToBackend(auth: AuthDefinition): void {
    const authIdentifier = factory.createIdentifier('auth');
    this.backendGenerator.addImport('./auth/resource', ['auth']);
    this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(authIdentifier));

    // CDK overrides for password policy, identity pool, user pool client
    // are handled by the BackendGenerator when it assembles backend.ts.
    // The auth definition properties (userPoolOverrides, guestLogin,
    // oAuthFlows, readAttributes, writeAttributes, userPoolClient) are
    // consumed by the synthesizer logic that will be migrated in Phase 3.
  }

  /**
   * Checks if the auth category uses imported (reference) resources.
   */
  private async buildReferenceAuth(authCategory: Record<string, unknown>): Promise<AuthDefinition | undefined> {
    const isImported = Object.values(authCategory).some(
      (value) => typeof value === 'object' && value !== null && 'serviceType' in value && (value as any).serviceType === 'imported',
    );
    if (!isImported) return undefined;

    const firstAuth = Object.values(authCategory)[0] as any;
    const userPoolId = firstAuth?.output?.UserPoolId;
    const userPoolClientId = firstAuth?.output?.AppClientIDWeb;
    const identityPoolId = firstAuth?.output?.IdentityPoolId;

    if (!userPoolId && !userPoolClientId && !identityPoolId) {
      throw new Error('No user pool or identity pool found for import.');
    }

    let authRoleArn: string | undefined;
    let unauthRoleArn: string | undefined;
    let groups: Record<string, string> | undefined;

    if (identityPoolId) {
      const { GetIdentityPoolRolesCommand } = await import('@aws-sdk/client-cognito-identity');
      const { Roles } = await this.gen1App.clients.cognitoIdentity.send(
        new GetIdentityPoolRolesCommand({ IdentityPoolId: identityPoolId }),
      );
      if (Roles) {
        authRoleArn = Roles.authenticated;
        unauthRoleArn = Roles.unauthenticated;
      }
    }

    if (userPoolId) {
      const { ListGroupsCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const { Groups } = await this.gen1App.clients.cognitoIdentityProvider.send(new ListGroupsCommand({ UserPoolId: userPoolId }));
      if (Groups && Groups.length > 0) {
        groups = Groups.reduce((acc: Record<string, string>, { GroupName, RoleArn }) => {
          if (GroupName && RoleArn) {
            acc[GroupName] = RoleArn;
          }
          return acc;
        }, {});
      }
    }

    return {
      referenceAuth: {
        userPoolId,
        userPoolClientId,
        identityPoolId,
        unauthRoleArn,
        authRoleArn,
        groups,
      },
    };
  }
}

import path from 'path';
import fs from 'node:fs/promises';
import { PackageJson, patchNpmPackageJson } from './npm_package/renderer';
import { RenderPipeline, Renderer } from './render_pipeline';
import { JsonRenderer } from './renderers/package_json';
import { TypescriptNodeArrayRenderer } from './renderers/typescript_block_node';
import { BackendRenderParameters, BackendSynthesizer } from './backend/synthesizer';
import { EnsureDirectory } from './renderers/ensure_directory';
import { Lambda } from './function/lambda';
import {
  AuthTriggerEvents,
  AuthLambdaTriggers,
  AuthDefinition,
  renderAuthNode,
  SendingAccount,
  PolicyOverrides,
  PasswordPolicyPath,
  UserPoolMfaConfig,
  Group,
  Attribute,
  EmailOptions,
  LoginOptions,
  StandardAttribute,
  StandardAttributes,
  CustomAttribute,
  CustomAttributes,
  MultifactorOptions,
  OidcOptions,
  OidcEndPoints,
  MetadataOptions,
  SamlOptions,
  Scope,
  AttributeMappingRule,
  ReferenceAuth,
} from './auth/source_builder';
import {
  StorageRenderParameters,
  renderStorage,
  AccessPatterns,
  Permission,
  S3TriggerDefinition,
  StorageTriggerEvent,
  ServerSideEncryptionConfiguration,
} from './storage/source_builder.js';

import { DataDefinition, DataTableMapping, generateDataSource } from './data/source_builder';

import { FunctionDefinition, renderFunctions } from './function/source_builder';
import assert from 'assert';

export interface Gen2RenderingOptions {
  outputDir: string;
  appId?: string;
  backendEnvironmentName?: string | undefined;
  auth?: AuthDefinition;
  storage?: StorageRenderParameters;
  data?: DataDefinition;
  functions?: FunctionDefinition[];
  unsupportedCategories?: Map<string, string>;
  fileWriter?: (content: string, path: string) => Promise<void>;
}
const createFileWriter = (path: string) => async (content: string) => fs.writeFile(path, content);

export const createGen2Renderer = ({
  outputDir,
  appId,
  backendEnvironmentName,
  auth,
  storage,
  data,
  functions,
  unsupportedCategories,
  fileWriter = (content, path) => createFileWriter(path)(content),
}: Readonly<Gen2RenderingOptions>): Renderer => {
  const ensureOutputDir = new EnsureDirectory(outputDir);
  const ensureAmplifyDirectory = new EnsureDirectory(path.join(outputDir, 'amplify'));
  const amplifyPackageJson = new JsonRenderer(
    async () => ({ type: 'module' }),
    (content) => fileWriter(content, path.join(outputDir, 'amplify', 'package.json')),
  );
  const jsonRenderer = new JsonRenderer(
    async () => {
      let packageJson: PackageJson = {
        name: 'my-gen2-app',
      };
      try {
        const packageJsonContents = await fs.readFile(`./package.json`, { encoding: 'utf-8' });
        packageJson = JSON.parse(packageJsonContents);
      } catch (e) {
        // File doesn't exist or is inaccessible. Ignore.
      }
      // Restrict dev dependencies to specific versions based on create-amplify gen2 flow:
      // https://github.com/aws-amplify/amplify-backend/blob/2dab201cb9a222c3b8c396a46c17d661411839ab/packages/create-amplify/src/amplify_project_creator.ts#L15-L24
      return patchNpmPackageJson(packageJson, {
        'aws-cdk': '^2',
        'aws-cdk-lib': '^2',
        constructs: '^10.0.0',
        typescript: '^5.0.0',
      });
    },
    (content) => fileWriter(content, path.join(outputDir, 'package.json')),
  );
  const amplifyTsConfigJson = new JsonRenderer(
    async () => ({
      compilerOptions: {
        target: 'es2022',
        module: 'es2022',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true,
        paths: {
          '$amplify/*': ['../.amplify/generated/*'],
        },
      },
    }),
    (content) => fileWriter(content, path.join(outputDir, 'amplify', 'tsconfig.json')),
  );
  const backendSynthesizer = new BackendSynthesizer();
  const backendRenderOptions: BackendRenderParameters = {};

  const renderers: Renderer[] = [ensureOutputDir, ensureAmplifyDirectory, amplifyPackageJson, amplifyTsConfigJson, jsonRenderer];

  if (unsupportedCategories && unsupportedCategories.size >= 1) {
    backendRenderOptions.unsupportedCategories = unsupportedCategories;
  }

  if (functions && functions.length) {
    const functionNamesAndCategory = new Map<string, string>();
    for (const func of functions) {
      if (func.name) {
        const resourceName = func.resourceName;
        assert(resourceName);
        const funcCategory = func.category;
        assert(funcCategory);
        functionNamesAndCategory.set(resourceName, funcCategory);
        const dirPath = path.join(outputDir, 'amplify', funcCategory, resourceName);
        renderers.push(new EnsureDirectory(dirPath));
        renderers.push(
          new TypescriptNodeArrayRenderer(
            async () => renderFunctions(func),
            (content) => {
              return fileWriter(content, path.join(dirPath, 'resource.ts'))
                .then(() => fileWriter('', path.join(dirPath, 'handler.ts')))
                .catch(console.error);
            },
          ),
        );
      }
    }

    backendRenderOptions.function = {
      importFrom: './function/resource',
      functionNamesAndCategories: functionNamesAndCategory,
    };
  }

  if (auth) {
    renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'auth')));
    renderers.push(
      new TypescriptNodeArrayRenderer(
        async () => renderAuthNode(auth),
        (content) => fileWriter(content, path.join(outputDir, 'amplify', 'auth', 'resource.ts')),
      ),
    );
    backendRenderOptions.auth = {
      importFrom: './auth/resource',
      userPoolOverrides: auth?.userPoolOverrides,
      guestLogin: auth?.guestLogin,
      identityPoolName: auth?.identityPoolName,
      oAuthFlows: auth?.oAuthFlows,
      readAttributes: auth?.readAttributes,
      writeAttributes: auth?.writeAttributes,
      referenceAuth: auth?.referenceAuth,
      userPoolClient: auth?.userPoolClient,
    };
  }

  if (data && data.tableMappings && backendEnvironmentName && data.tableMappings[backendEnvironmentName] !== undefined) {
    renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'data')));
    renderers.push(
      new TypescriptNodeArrayRenderer(
        async () => generateDataSource(data),
        (content) => fileWriter(content, path.join(outputDir, 'amplify', 'data', 'resource.ts')),
      ),
    );
    backendRenderOptions.data = {
      importFrom: './data/resource',
    };
  }

  if (storage) {
    const hasS3Bucket = storage?.accessPatterns || storage?.storageIdentifier;
    if (hasS3Bucket) {
      renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'storage')));
      renderers.push(
        new TypescriptNodeArrayRenderer(
          async () => renderStorage(storage),
          (content) => fileWriter(content, path.join(outputDir, 'amplify', 'storage', 'resource.ts')),
        ),
      );
    }
    backendRenderOptions.storage = {
      importFrom: './storage/resource',
      dynamoDB: storage.dynamoDB,
      accelerateConfiguration: storage.accelerateConfiguration,
      versionConfiguration: storage.versioningConfiguration,
      hasS3Bucket: hasS3Bucket,
      bucketEncryptionAlgorithm: storage.bucketEncryptionAlgorithm,
      bucketName: storage.bucketName,
    };
  }

  const backendRenderer = new TypescriptNodeArrayRenderer(
    async () => backendSynthesizer.render(backendRenderOptions),
    (content) => fileWriter(content, path.join(outputDir, 'amplify', 'backend.ts')),
  );

  renderers.push(backendRenderer);

  return new RenderPipeline(renderers);
};
export {
  Renderer,
  SendingAccount,
  UserPoolMfaConfig,
  StorageRenderParameters,
  AccessPatterns,
  Permission,
  S3TriggerDefinition,
  PasswordPolicyPath,
  AuthDefinition,
  FunctionDefinition,
  PolicyOverrides,
  Group,
  Attribute,
  EmailOptions,
  LoginOptions,
  StandardAttribute,
  StandardAttributes,
  CustomAttribute,
  CustomAttributes,
  MultifactorOptions,
  AuthTriggerEvents,
  Lambda,
  AuthLambdaTriggers,
  StorageTriggerEvent,
  DataDefinition,
  DataTableMapping,
  SamlOptions,
  OidcEndPoints,
  MetadataOptions,
  OidcOptions,
  Scope,
  AttributeMappingRule,
  ServerSideEncryptionConfiguration,
  ReferenceAuth,
};

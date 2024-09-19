import path from 'path';
import fs from 'node:fs/promises';
import { patchNpmPackageJson } from './npm_package/renderer';
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
} from './auth/source_builder';
import {
  StorageRenderParameters,
  renderStorage,
  AccessPatterns,
  Permission,
  S3TriggerDefinition,
  StorageTriggerEvent,
} from './storage/source_builder.js';

import { DataDefinition, generateDataSource } from './data/source_builder';

import { FunctionDefinition, renderFunctions } from './function/source_builder';

export interface Gen2RenderingOptions {
  outputDir: string;
  appId?: string;
  backendEnvironmentName?: string | undefined;
  auth?: AuthDefinition;
  storage?: StorageRenderParameters;
  data?: DataDefinition;
  functions?: FunctionDefinition[];
  unsupportedCategories?: string[];
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
    () => ({ type: 'module' }),
    (content) => fileWriter(content, path.join(outputDir, 'amplify', 'package.json')),
  );
  const jsonRenderer = new JsonRenderer(
    () => patchNpmPackageJson({}),
    (content) => fileWriter(content, path.join(outputDir, 'package.json')),
  );
  const backendSynthesizer = new BackendSynthesizer();
  const backendRenderOptions: BackendRenderParameters = {};

  const renderers: Renderer[] = [ensureOutputDir, ensureAmplifyDirectory, amplifyPackageJson, jsonRenderer];

  if (unsupportedCategories && unsupportedCategories?.length >= 1) {
    console.log('inside unsupported ctageories: -- ', unsupportedCategories);
    backendRenderOptions.unsupportedCategories = {
      categories: unsupportedCategories,
    };
  }

  if (functions) {
    const functionNamesAndCategory = new Map<string, string>();
    for (const func of functions) {
      if (func.name && func.category) {
        const splitFunctionName = func.name.split('-')[0];
        functionNamesAndCategory.set(splitFunctionName, func.category);
        renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', func.category || 'function', func.name.split('-')[0])));
        renderers.push(
          new TypescriptNodeArrayRenderer(
            async () => renderFunctions(func, appId, backendEnvironmentName),
            (content) => {
              const filePath = path.join(outputDir, 'amplify', func.category || 'function', splitFunctionName);
              return fileWriter(content, path.join(filePath, 'resource.ts')).then(() => fileWriter('', path.join(filePath, 'handler.ts')));
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
      oAuthFlows: auth?.oAuthFlows,
      readAttributes: auth?.readAttributes,
      writeAttributes: auth?.writeAttributes,
    };
  }
  if (data) {
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
    renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'storage')));
    renderers.push(
      new TypescriptNodeArrayRenderer(
        async () => renderStorage(storage),
        (content) => fileWriter(content, path.join(outputDir, 'amplify', 'storage', 'resource.ts')),
      ),
    );
    backendRenderOptions.storage = {
      importFrom: './storage/resource',
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
  SamlOptions,
  OidcEndPoints,
  MetadataOptions,
  OidcOptions,
  Scope,
};

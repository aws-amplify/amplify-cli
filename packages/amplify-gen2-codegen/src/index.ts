import path from 'path';
import fs from 'node:fs/promises';
import { patchNpmPackageJson } from './npm_package/renderer';
import { RenderPipeline, Renderer } from './render_pipeline';
import { JsonRenderer } from './renderers/package_json';
import { TypescriptNodeArrayRenderer } from './renderers/typescript_block_node';
import { BackendSynthesizer } from './backend/synthesizer';
import { EnsureDirectory } from './renderers/ensure_directory';
import { Lambda } from './function/lambda';
import {
  AuthTriggerEvents,
  AuthDefinition,
  renderAuthNode,
  SendingAccount,
  UserPoolOverrides,
  PasswordPolicyPath,
  UserPoolMfaConfig,
  Group,
  Attribute,
  EmailOptions,
  LoginOptions,
  StandardAttribute,
  StandardAttributes,
  MultifactorOptions,
} from './auth/source_builder';
import { StorageRenderParameters, renderStorage, AccessPatterns, Permission, S3TriggerDefinition } from './storage/source_builder.js';

export interface Gen2RenderingOptions {
  outputDir: string;
  auth?: AuthDefinition;
  storage?: StorageRenderParameters;
  fileWriter?: (content: string, path: string) => Promise<void>;
}
const createFileWriter = (path: string) => async (content: string) => fs.writeFile(path, content);

export const createGen2Renderer = ({
  outputDir,
  auth,
  storage,
  fileWriter = (content, path) => createFileWriter(path)(content),
}: Gen2RenderingOptions): Renderer => {
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
  const backendRenderer = new TypescriptNodeArrayRenderer(
    async () =>
      backendSynthesizer.render({
        storage: {
          importFrom: './storage/resource',
        },
        auth: {
          importFrom: './auth/resource',
          userPoolOverrides: auth?.userPoolOverrides,
        },
      }),
    (content) => fileWriter(content, path.join(outputDir, 'amplify', 'backend.ts')),
  );
  const renderers = [ensureOutputDir, ensureAmplifyDirectory, amplifyPackageJson, jsonRenderer, backendRenderer];
  if (auth) {
    renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'auth')));
    renderers.push(
      new TypescriptNodeArrayRenderer(
        async () => renderAuthNode(auth),
        (content) => fileWriter(content, path.join(outputDir, 'amplify', 'auth', 'resource.ts')),
      ),
    );
  }
  if (storage) {
    renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'storage')));
    renderers.push(
      new TypescriptNodeArrayRenderer(
        async () => renderStorage(storage),
        (content) => fileWriter(content, path.join(outputDir, 'amplify', 'storage', 'resource.ts')),
      ),
    );
  }

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
  UserPoolOverrides,
  Group,
  Attribute,
  EmailOptions,
  LoginOptions,
  StandardAttribute,
  StandardAttributes,
  MultifactorOptions,
  AuthTriggerEvents,
  Lambda,
};

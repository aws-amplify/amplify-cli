import { Renderer } from '../render_pipeline';
import { Lambda } from '../generators/functions/lambda';
import {
  AuthTriggerEvents,
  AuthLambdaTriggers,
  AuthDefinition,
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
} from '../generators/auth/index';
import {
  StorageRenderParameters,
  AccessPatterns,
  Permission,
  S3TriggerDefinition,
  StorageTriggerEvent,
  ServerSideEncryptionConfiguration,
} from '../generators/storage/index.js';
import { DataDefinition, DataTableMapping } from '../generators/data/index';
import { FunctionDefinition } from '../generators/functions/index';
export interface Gen2RenderingOptions {
  outputDir: string;
  appId?: string;
  backendEnvironmentName?: string | undefined;
  auth?: AuthDefinition;
  storage?: StorageRenderParameters;
  data?: DataDefinition;
  functions?: FunctionDefinition[];
  customResources?: Map<string, string>;
  unsupportedCategories?: Map<string, string>;
  fileWriter?: (content: string, path: string) => Promise<void>;
}
export declare const createGen2Renderer: ({
  outputDir,
  backendEnvironmentName,
  auth,
  storage,
  data,
  functions,
  customResources,
  unsupportedCategories,
  fileWriter,
}: Readonly<Gen2RenderingOptions>) => Renderer;
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
//# sourceMappingURL=migration-pipeline.d.ts.map

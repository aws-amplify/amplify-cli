/* eslint-disable no-new */
import { FeatureFlagProvider, GraphQLAPIProvider, TransformerPluginProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { AuthorizationMode, AuthorizationType } from '@aws-cdk/aws-appsync';
import { App, Aws, CfnOutput, Fn } from '@aws-cdk/core';
import assert from 'assert';
import {
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
  parse,
  ScalarTypeDefinitionNode,
  TypeDefinitionNode,
  TypeExtensionNode,
  UnionTypeDefinitionNode,
} from 'graphql';
import { InvalidTransformerError, SchemaValidationError, UnknownDirectiveError } from '../errors';
import { GraphQLApi } from '../graphql-api';
import { TransformerContext } from '../transformer-context';
import { TransformerOutput } from '../transformer-context/output';
import { StackManager } from '../transformer-context/stack-manager';
import { adoptAuthModes } from '../utils/authType';
import { AppSyncAuthConfiguration, TransformConfig } from './transformer-config';
import Template, { DeploymentResources } from './types';
import {
  makeSeenTransformationKey,
  matchArgumentDirective,
  matchDirective,
  matchEnumValueDirective,
  matchFieldDirective,
  matchInputFieldDirective,
  sortTransformerPlugins,
} from './utils';
import { validateModelSchema } from './validation';

// eslint-disable-next-line @typescript-eslint/ban-types
function isFunction(obj: any): obj is Function {
  return obj && typeof obj === 'function';
}

type TypeDefinitionOrExtension = TypeDefinitionNode | TypeExtensionNode;

/**
 * A generic transformation library that takes as input a graphql schema
 * written in SDL and a set of transformers that operate on it. At the
 * end of a transformation, a fully specified cloudformation template
 * is emitted.
 */
export interface GraphQLTransformOptions {
  readonly transformers: TransformerPluginProvider[];
  // Override the formatters stack mapping. This is useful when handling
  // migrations as all the input/export/ref/getAtt changes will be made
  // automatically.
  readonly stackMapping?: StackMapping;
  // transform config which can change the behavior of the transformer
  readonly transformConfig?: TransformConfig;
  readonly authConfig?: AppSyncAuthConfiguration;
  readonly buildParameters?: Record<string, any>;
  readonly stacks?: Record<string, Template>;
  readonly featuerFlags?: FeatureFlagProvider;
}
export type StackMapping = { [resourceId: string]: string };
export class GraphQLTransform {
  private transformers: TransformerPluginProvider[];
  private stackMappingOverrides: StackMapping;
  private app: App | undefined;
  private readonly authConfig: AppSyncAuthConfiguration;
  private readonly buildParameters: Record<string, any>;

  // A map from `${directive}.${typename}.${fieldName?}`: true
  // that specifies we have run already run a directive at a given location.
  // Only run a transformer function once per pair. This is refreshed each call to transform().
  private seenTransformations: { [k: string]: boolean } = {};

  constructor(private readonly options: GraphQLTransformOptions) {
    if (!options.transformers || options.transformers.length === 0) {
      throw new Error('Must provide at least one transformer.');
    }
    const sortedTransformers = sortTransformerPlugins(options.transformers);
    this.transformers = sortedTransformers;

    this.authConfig = options.authConfig || {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
        apiKeyConfig: {
          apiKeyExpirationDays: 7,
          description: 'Default API Key',
        },
      },
      additionalAuthenticationProviders: [],
    };

    this.buildParameters = options.buildParameters || {};
    this.stackMappingOverrides = options.stackMapping || {};
  }

  /**
   * Reduces the final context by running the set of transformers on
   * the schema. Each transformer returns a new context that is passed
   * on to the next transformer. At the end of the transformation a
   * cloudformation template is returned.
   * @param schema The model schema.
   * @param references Any cloudformation references.
   */
  public transform(schema: string): DeploymentResources {
    this.seenTransformations = {};
    const parsedDocument = parse(schema);
    this.app = new App();
    const context = new TransformerContext(this.app, parsedDocument, this.stackMappingOverrides, this.options.featuerFlags);
    const validDirectiveNameMap = this.transformers.reduce(
      (acc: any, t: TransformerPluginProvider) => ({ ...acc, [t.directive.name.value]: true }),
      {
        aws_subscribe: true,
        aws_auth: true,
        aws_api_key: true,
        aws_iam: true,
        aws_oidc: true,
        aws_cognito_user_pools: true,
        deprecated: true,
      },
    );
    let allModelDefinitions = [...context.inputDocument.definitions];
    for (const transformer of this.transformers) {
      allModelDefinitions = allModelDefinitions.concat(...transformer.typeDefinitions, transformer.directive);
    }
    const errors = validateModelSchema({
      kind: Kind.DOCUMENT,
      definitions: allModelDefinitions,
    });
    if (errors && errors.length) {
      throw new SchemaValidationError(errors);
    }

    // // check if the project is sync enabled
    // if (this.transformConfig.ResolverConfig) {
    //   this.createResourcesForSyncEnabledProject(context);
    //   context.setResolverConfig(this.transformConfig.ResolverConfig);
    // }

    // // Transformer version is populated, store it in the transformer context, to make it accessible to transformers
    // context.setTransformerVersion(this.transformConfig.Version!);

    for (const transformer of this.transformers) {
      if (isFunction(transformer.before)) {
        transformer.before(context);
      }
    }
    // TODO: Validate that the transformer supports all the methods
    // required for the directive definition. Also verify that
    // directives are not used where they are not allowed.

    // Apply each transformer and accumulate the context.
    for (const transformer of this.transformers) {
      for (const def of context.inputDocument.definitions as TypeDefinitionOrExtension[]) {
        switch (def.kind) {
          case 'ObjectTypeDefinition':
            this.transformObject(transformer, def, validDirectiveNameMap, context);
            // Walk the fields and call field transformers.
            break;
          case 'InterfaceTypeDefinition':
            this.transformInterface(transformer, def, validDirectiveNameMap, context);
            // Walk the fields and call field transformers.
            break;
          case 'ScalarTypeDefinition':
            this.transformScalar(transformer, def, validDirectiveNameMap, context);
            break;
          case 'UnionTypeDefinition':
            this.transformUnion(transformer, def, validDirectiveNameMap, context);
            break;
          case 'EnumTypeDefinition':
            this.transformEnum(transformer, def, validDirectiveNameMap, context);
            break;
          case 'InputObjectTypeDefinition':
            this.transformInputObject(transformer, def, validDirectiveNameMap, context);
            break;
          default:
            continue;
        }
      }
    }

    // Validate
    for (const transformer of this.transformers) {
      if (isFunction(transformer.validate)) {
        transformer.validate(context);
      }
    }

    // Prepare
    for (const transformer of this.transformers) {
      if (isFunction(transformer.prepare)) {
        transformer.prepare(context);
      }
    }

    // transform schema
    for (const transformer of this.transformers) {
      if (isFunction(transformer.transformSchema)) {
        transformer.transformSchema(context);
      }
    }

    // generate resolvers

    // Syth the API and make it available to allow transformer plugins to manipulate the API

    const stackManager = context.stackManager as StackManager;
    const output: TransformerOutput = context.output as TransformerOutput;

    const api = this.generateGraphQlApi(stackManager, output);

    (context as TransformerContext).bind(api);
    for (const transformer of this.transformers) {
      if (isFunction(transformer.generateResolvers)) {
        transformer.generateResolvers(context);
      }
    }

    // .transform() is meant to behave like a composition so the
    // after functions are called in the reverse order (as if they were popping off a stack)
    let reverseThroughTransformers = this.transformers.length - 1;
    while (reverseThroughTransformers >= 0) {
      const transformer = this.transformers[reverseThroughTransformers];
      if (isFunction(transformer.after)) {
        transformer.after(context);
      }
      reverseThroughTransformers -= 1;
    }
    this.collectResolvers(context, context.api);
    return this.synthesize(context);
  }

  private generateGraphQlApi(stackManager: StackManager, output: TransformerOutput) {
    // Todo: Move this to its own transformer plugin to support modifying the API
    // Like setting the auth mode and enabling logging and such

    const rootStack = stackManager.rootStack;
    const authorizationConfig = adoptAuthModes(stackManager, this.authConfig);
    const apiName = stackManager.addParameter('AppSyncApiName', { type: 'String' }).valueAsString;
    const envName = stackManager.getParameter('env');
    assert(envName);
    const api = new GraphQLApi(rootStack, 'GraphQLAPI', {
      name: `${apiName}-${envName.valueAsString}`,
      authorizationConfig,
    });
    const authModes = [authorizationConfig.defaultAuthorization, ...(authorizationConfig.additionalAuthorizationModes || [])].map(
      mode => mode?.authorizationType,
    );

    if (
      authModes.includes(AuthorizationType.API_KEY) &&
      !(this.buildParameters.CreateAPIKey && this.buildParameters.CreateAPIKey !== false)
    ) {
      const apiKeyConfig: AuthorizationMode | undefined = [
        authorizationConfig.defaultAuthorization,
        ...(authorizationConfig.additionalAuthorizationModes || []),
      ].find(auth => auth?.authorizationType == AuthorizationType.API_KEY);
      const apiKeyDescription = apiKeyConfig!.apiKeyConfig?.description;
      const apiKeyExpirationDays = apiKeyConfig!.apiKeyConfig?.expires;

      const apiKey = api.createAPIKey({
        description: apiKeyDescription,
        expires: apiKeyExpirationDays,
      });

      new CfnOutput(rootStack, 'GraphQLAPIKeyOutput', {
        value: apiKey.attrApiKey,
        description: 'Your GraphQL API ID.',
        exportName: Fn.join(':', [Aws.STACK_NAME, 'GraphQLApiKey']),
      });
    }

    new CfnOutput(rootStack, 'GraphQLAPIIdOutput', {
      value: api.apiId,
      description: 'Your GraphQL API ID.',
      exportName: Fn.join(':', [Aws.STACK_NAME, 'GraphQLApiId']),
    });

    new CfnOutput(rootStack, 'GraphQLAPIEndpointOutput', {
      value: api.graphqlUrl,
      description: 'Your GraphQL API endpoint.',
      exportName: Fn.join(':', [Aws.STACK_NAME, 'GraphQLApiEndpoint']),
    });
    api.addToSchema(output.buildSchema());
    return api;
  }

  private synthesize(context: TransformerContext): DeploymentResources {
    const stackManager: StackManager = context.stackManager as StackManager;
    // eslint-disable-next-line no-unused-expressions
    this.app?.synth({ force: true, skipValidation: true });

    const templates = stackManager.getCloudFormationTemplates();
    const rootStackTemplate = templates.get('transformer-root-stack');
    let childStacks: Record<string, Template> = {};
    for (let [templateName, template] of templates.entries()) {
      if (templateName !== 'transformer-root-stack') {
        childStacks[templateName] = template;
      }
    }

    const fileAssets = stackManager.getMappingTemplates();
    const pipelineFunctions: Record<string, string> = {};
    const resolvers: Record<string, string> = {};
    const functions: Record<string, string> = {};
    for (let [templateName, template] of fileAssets) {
      if (templateName.startsWith('pipelineFunctions/')) {
        pipelineFunctions[templateName.replace('pipelineFunctions/', '')] = template;
      } else if (templateName.startsWith('resolvers/')) {
        resolvers[templateName.replace('resolvers/', '')] = template;
      } else if (templateName.startsWith('functions/')) {
        functions[templateName.replace('functions/', '')] = template;
      }
    }
    const schema = fileAssets.get('schema.graphql') || '';
    return {
      functions,
      pipelineFunctions,
      stackMapping: {},
      resolvers,
      schema,
      stacks: childStacks,
      rootStack: rootStackTemplate!,
    };
  }

  private collectResolvers(context: TransformerContext, api: GraphQLAPIProvider): void {
    const resolverEntries = context.resolvers.collectResolvers();
    for (let [, resolver] of resolverEntries) {
      resolver.synthesize(context, api);
    }
  }

  private transformObject(
    transformer: TransformerPluginProvider,
    def: ObjectTypeDefinitionNode,
    validDirectiveNameMap: { [k: string]: boolean },
    context: TransformerContext,
  ) {
    let index = 0;
    for (const dir of def.directives ?? []) {
      if (!validDirectiveNameMap[dir.name.value]) {
        throw new UnknownDirectiveError(
          `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`,
        );
      }
      if (matchDirective(transformer.directive, dir, def)) {
        if (isFunction(transformer.object)) {
          const transformKey = makeSeenTransformationKey(dir, def, undefined, undefined, index);
          if (!this.seenTransformations[transformKey]) {
            transformer.object(def, dir, context);
            this.seenTransformations[transformKey] = true;
          }
        } else {
          throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'object()' method`);
        }
      }
      index++;
    }
    for (const field of def.fields ?? []) {
      this.transformField(transformer, def, field, validDirectiveNameMap, context);
    }
  }

  private transformField(
    transformer: TransformerPluginProvider,
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    def: FieldDefinitionNode,
    validDirectiveNameMap: { [k: string]: boolean },
    context: TransformerContext,
  ) {
    let index = 0;
    for (const dir of def.directives ?? []) {
      if (!validDirectiveNameMap[dir.name.value]) {
        throw new UnknownDirectiveError(
          `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`,
        );
      }
      if (matchFieldDirective(transformer.directive, dir, def)) {
        if (isFunction(transformer.field)) {
          const transformKey = makeSeenTransformationKey(dir, parent, def, undefined, index);
          if (!this.seenTransformations[transformKey]) {
            transformer.field(parent, def, dir, context);
            this.seenTransformations[transformKey] = true;
          }
        } else {
          throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'field()' method`);
        }
      }
      index++;
    }
    for (const arg of def.arguments ?? []) {
      this.transformArgument(transformer, parent, def, arg, validDirectiveNameMap, context);
    }
  }

  private transformArgument(
    transformer: TransformerPluginProvider,
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    field: FieldDefinitionNode,
    arg: InputValueDefinitionNode,
    validDirectiveNameMap: { [k: string]: boolean },
    context: TransformerContext,
  ) {
    let index = 0;
    for (const dir of arg.directives ?? []) {
      if (!validDirectiveNameMap[dir.name.value]) {
        throw new UnknownDirectiveError(
          `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`,
        );
      }
      if (matchArgumentDirective(transformer.directive, dir, arg)) {
        if (isFunction(transformer.argument)) {
          const transformKey = makeSeenTransformationKey(dir, parent, field, arg, index);
          if (!this.seenTransformations[transformKey]) {
            transformer.argument(arg, dir, context);
            this.seenTransformations[transformKey] = true;
          }
        } else {
          throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'argument()' method`);
        }
      }
      index++;
    }
  }

  private transformInterface(
    transformer: TransformerPluginProvider,
    def: InterfaceTypeDefinitionNode,
    validDirectiveNameMap: { [k: string]: boolean },
    context: TransformerContext,
  ) {
    let index = 0;
    for (const dir of def.directives ?? []) {
      if (!validDirectiveNameMap[dir.name.value]) {
        throw new UnknownDirectiveError(
          `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`,
        );
      }
      if (matchDirective(transformer.directive, dir, def)) {
        if (isFunction(transformer.interface)) {
          const transformKey = makeSeenTransformationKey(dir, def, undefined, undefined, index);
          if (!this.seenTransformations[transformKey]) {
            transformer.interface(def, dir, context);
            this.seenTransformations[transformKey] = true;
          }
        } else {
          throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'interface()' method`);
        }
      }
      index++;
    }
    for (const field of def.fields ?? []) {
      this.transformField(transformer, def, field, validDirectiveNameMap, context);
    }
  }

  private transformScalar(
    transformer: TransformerPluginProvider,
    def: ScalarTypeDefinitionNode,
    validDirectiveNameMap: { [k: string]: boolean },
    context: TransformerContext,
  ) {
    let index = 0;
    for (const dir of def.directives ?? []) {
      if (!validDirectiveNameMap[dir.name.value]) {
        throw new UnknownDirectiveError(
          `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`,
        );
      }
      if (matchDirective(transformer.directive, dir, def)) {
        if (isFunction(transformer.scalar)) {
          const transformKey = makeSeenTransformationKey(dir, def, undefined, undefined, index);
          if (!this.seenTransformations[transformKey]) {
            transformer.scalar(def, dir, context);
            this.seenTransformations[transformKey] = true;
          }
        } else {
          throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'scalar()' method`);
        }
      }
      index++;
    }
  }

  private transformUnion(
    transformer: TransformerPluginProvider,
    def: UnionTypeDefinitionNode,
    validDirectiveNameMap: { [k: string]: boolean },
    context: TransformerContext,
  ) {
    let index = 0;
    for (const dir of def.directives ?? []) {
      if (!validDirectiveNameMap[dir.name.value]) {
        throw new UnknownDirectiveError(
          `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`,
        );
      }
      if (matchDirective(transformer.directive, dir, def)) {
        if (isFunction(transformer.union)) {
          const transformKey = makeSeenTransformationKey(dir, def, undefined, undefined, index);
          if (!this.seenTransformations[transformKey]) {
            transformer.union(def, dir, context);
            this.seenTransformations[transformKey] = true;
          }
        } else {
          throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'union()' method`);
        }
      }
      index++;
    }
  }

  private transformEnum(
    transformer: TransformerPluginProvider,
    def: EnumTypeDefinitionNode,
    validDirectiveNameMap: { [k: string]: boolean },
    context: TransformerContext,
  ) {
    let index = 0;
    for (const dir of def.directives ?? []) {
      if (!validDirectiveNameMap[dir.name.value]) {
        throw new UnknownDirectiveError(
          `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`,
        );
      }
      if (matchDirective(transformer.directive, dir, def)) {
        if (isFunction(transformer.enum)) {
          const transformKey = makeSeenTransformationKey(dir, def, undefined, undefined, index);
          if (!this.seenTransformations[transformKey]) {
            transformer.enum(def, dir, context);
            this.seenTransformations[transformKey] = true;
          }
        } else {
          throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'enum()' method`);
        }
      }
      index++;
    }
    for (const value of def.values ?? []) {
      this.transformEnumValue(transformer, def, value, validDirectiveNameMap, context);
    }
  }

  private transformEnumValue(
    transformer: TransformerPluginProvider,
    enm: EnumTypeDefinitionNode,
    def: EnumValueDefinitionNode,
    validDirectiveNameMap: { [k: string]: boolean },
    context: TransformerContext,
  ) {
    let index = 0;
    for (const dir of def.directives ?? []) {
      if (!validDirectiveNameMap[dir.name.value]) {
        throw new UnknownDirectiveError(
          `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`,
        );
      }
      if (matchEnumValueDirective(transformer.directive, dir, def)) {
        if (isFunction(transformer.enumValue)) {
          const transformKey = makeSeenTransformationKey(dir, enm, def, undefined, index);
          if (!this.seenTransformations[transformKey]) {
            transformer.enumValue(def, dir, context);
            this.seenTransformations[transformKey] = true;
          }
        } else {
          throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'enumValue()' method`);
        }
      }
      index++;
    }
  }

  private transformInputObject(
    transformer: TransformerPluginProvider,
    def: InputObjectTypeDefinitionNode,
    validDirectiveNameMap: { [k: string]: boolean },
    context: TransformerContext,
  ) {
    let index = 0;
    for (const dir of def.directives ?? []) {
      if (!validDirectiveNameMap[dir.name.value]) {
        throw new UnknownDirectiveError(
          `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`,
        );
      }
      if (matchDirective(transformer.directive, dir, def)) {
        if (isFunction(transformer.input)) {
          const transformKey = makeSeenTransformationKey(dir, def, undefined, undefined, index);
          if (!this.seenTransformations[transformKey]) {
            transformer.input(def, dir, context);
            this.seenTransformations[transformKey] = true;
          }
        } else {
          throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'input()' method`);
        }
      }
      index++;
    }
    for (const field of def.fields ?? []) {
      this.transformInputField(transformer, def, field, validDirectiveNameMap, context);
    }
  }

  private transformInputField(
    transformer: TransformerPluginProvider,
    input: InputObjectTypeDefinitionNode,
    def: InputValueDefinitionNode,
    validDirectiveNameMap: { [k: string]: boolean },
    context: TransformerContext,
  ) {
    let index = 0;
    for (const dir of def.directives ?? []) {
      if (!validDirectiveNameMap[dir.name.value]) {
        throw new UnknownDirectiveError(
          `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`,
        );
      }
      if (matchInputFieldDirective(transformer.directive, dir, def)) {
        if (isFunction(transformer.inputValue)) {
          const transformKey = makeSeenTransformationKey(dir, input, def, undefined, index);
          if (!this.seenTransformations[transformKey]) {
            transformer.inputValue(def, dir, context);
            this.seenTransformations[transformKey] = true;
          }
        } else {
          throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'inputValue()' method`);
        }
      }
      index++;
    }
  }
}

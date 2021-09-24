import {
  DirectiveWrapper,
  IAM_AUTH_ROLE_PARAMETER,
  IAM_UNAUTH_ROLE_PARAMETER,
  MappingTemplate,
  TransformerPluginBase,
} from '@aws-amplify/graphql-transformer-core';
import { TransformerContextProvider, TransformerSchemaVisitStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import * as lambda from '@aws-cdk/aws-lambda';
import { AuthorizationType } from '@aws-cdk/aws-appsync';
import * as cdk from '@aws-cdk/core';
import { obj, str, toJson, ref, printBlock, compoundExpression, qref, raw, iff, Expression } from 'graphql-mapping-template';
import { FunctionResourceIDs, ResolverResourceIDs, ResourceConstants } from 'graphql-transformer-common';
import { DirectiveNode, ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode, FieldDefinitionNode } from 'graphql';

type FunctionDirectiveConfiguration = {
  name: string;
  region: string | undefined;
  resolverTypeName: string;
  resolverFieldName: string;
};

const FUNCTION_DIRECTIVE_STACK = 'FunctionDirectiveStack';
const directiveDefinition = /* GraphQL */ `
  directive @function(name: String!, region: String) repeatable on FIELD_DEFINITION
`;

export class FunctionTransformer extends TransformerPluginBase {
  private resolverGroups: Map<FieldDefinitionNode, FunctionDirectiveConfiguration[]> = new Map();

  constructor() {
    super('amplify-function-transformer', directiveDefinition);
  }

  field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    acc: TransformerSchemaVisitStepContextProvider,
  ): void => {
    const directiveWrapped = new DirectiveWrapper(directive);
    const args = directiveWrapped.getArguments({
      resolverTypeName: parent.name.value,
      resolverFieldName: definition.name.value,
    } as FunctionDirectiveConfiguration);
    let resolver = this.resolverGroups.get(definition);

    if (resolver === undefined) {
      resolver = [];
      this.resolverGroups.set(definition, resolver);
    }

    resolver.push(args);
  };

  generateResolvers = (context: TransformerContextProvider): void => {
    if (this.resolverGroups.size === 0) {
      return;
    }

    const stack: cdk.Stack = context.stackManager.createStack(FUNCTION_DIRECTIVE_STACK);
    const createdResources = new Map<string, any>();
    const env = context.stackManager.getParameter(ResourceConstants.PARAMETERS.Env) as cdk.CfnParameter;

    stack.templateOptions.templateFormatVersion = '2010-09-09';
    stack.templateOptions.description = 'An auto-generated nested stack for the @function directive.';

    new cdk.CfnCondition(stack, ResourceConstants.CONDITIONS.HasEnvironmentParameter, {
      expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(env, ResourceConstants.NONE)),
    });

    this.resolverGroups.forEach((resolverFns, fieldDefinition) => {
      resolverFns.forEach(config => {
        // Create data sources that register Lambdas and IAM roles.
        const dataSourceId = FunctionResourceIDs.FunctionDataSourceID(config.name, config.region);

        if (!createdResources.has(dataSourceId)) {
          const dataSource = context.api.host.addLambdaDataSource(
            dataSourceId,
            lambda.Function.fromFunctionAttributes(stack, `${dataSourceId}Function`, {
              functionArn: lambdaArnResource(env, config.name, config.region),
            }),
            {},
            stack,
          );
          createdResources.set(dataSourceId, dataSource);
        }

        // Create AppSync functions.
        const functionId = FunctionResourceIDs.FunctionAppSyncFunctionConfigurationID(config.name, config.region);
        let func = createdResources.get(functionId);

        if (func === undefined) {
          func = context.api.host.addAppSyncFunction(
            functionId,
            MappingTemplate.s3MappingTemplateFromString(
              printBlock(`Invoke AWS Lambda data source: ${dataSourceId}`)(
                toJson(
                  obj({
                    version: str('2018-05-29'),
                    operation: str('Invoke'),
                    payload: obj({
                      typeName: ref('ctx.stash.get("typeName")'),
                      fieldName: ref('ctx.stash.get("fieldName")'),
                      arguments: ref('util.toJson($ctx.arguments)'),
                      identity: ref('util.toJson($ctx.identity)'),
                      source: ref('util.toJson($ctx.source)'),
                      request: ref('util.toJson($ctx.request)'),
                      prev: ref('util.toJson($ctx.prev)'),
                    }),
                  }),
                ),
              ),
              `${functionId}.req.vtl`,
            ),
            MappingTemplate.s3MappingTemplateFromString(
              printBlock('Handle error or return result')(
                compoundExpression([
                  iff(ref('ctx.error'), raw('$util.error($ctx.error.message, $ctx.error.type)')),
                  raw('$util.toJson($ctx.result)'),
                ]),
              ),
              `${functionId}.res.vtl`,
            ),
            dataSourceId,
            stack,
          );

          createdResources.set(functionId, func);
        }

        // Create the GraphQL resolvers.
        const resolverId = ResolverResourceIDs.ResolverResourceID(config.resolverTypeName, config.resolverFieldName);
        let resolver = createdResources.get(resolverId);

        const requestTemplate: Array<Expression> = [
          qref(`$ctx.stash.put("typeName", "${config.resolverTypeName}")`),
          qref(`$ctx.stash.put("fieldName", "${config.resolverFieldName}")`),
        ];
        const authModes = [context.authConfig.defaultAuthentication, ...(context.authConfig.additionalAuthenticationProviders || [])].map(
          mode => mode?.authenticationType,
        );
        if (authModes.includes(AuthorizationType.IAM)) {
          const authRoleParameter = (context.stackManager.getParameter(IAM_AUTH_ROLE_PARAMETER) as cdk.CfnParameter).valueAsString;
          const unauthRoleParameter = (context.stackManager.getParameter(IAM_UNAUTH_ROLE_PARAMETER) as cdk.CfnParameter).valueAsString;
          requestTemplate.push(
            qref(
              `$ctx.stash.put("authRole", "arn:aws:sts::${
                cdk.Stack.of(context.stackManager.rootStack).account
              }:assumed-role/${authRoleParameter}/CognitoIdentityCredentials")`,
            ),
            qref(
              `$ctx.stash.put("unauthRole", "arn:aws:sts::${
                cdk.Stack.of(context.stackManager.rootStack).account
              }:assumed-role/${unauthRoleParameter}/CognitoIdentityCredentials")`,
            ),
          );
        }
        requestTemplate.push(obj({}));

        if (resolver === undefined) {
          // TODO: update function to use resolver manager
          resolver = context.api.host.addResolver(
            config.resolverTypeName,
            config.resolverFieldName,
            MappingTemplate.inlineTemplateFromString(printBlock('Stash resolver specific context.')(compoundExpression(requestTemplate))),
            MappingTemplate.s3MappingTemplateFromString(
              '$util.toJson($ctx.prev.result)',
              `${config.resolverTypeName}.${config.resolverFieldName}.res.vtl`,
            ),
            undefined,
            [],
            stack,
          );
          createdResources.set(resolverId, resolver);
        }

        resolver.pipelineConfig.functions.push(func.functionId);
      });
    });
  };
}

function lambdaArnResource(env: cdk.CfnParameter, name: string, region?: string): string {
  const substitutions: { [key: string]: string } = {};
  if (name.includes('${env}')) {
    substitutions.env = env as unknown as string;
  }
  return cdk.Fn.conditionIf(
    ResourceConstants.CONDITIONS.HasEnvironmentParameter,
    cdk.Fn.sub(lambdaArnKey(name, region), substitutions),
    cdk.Fn.sub(lambdaArnKey(name.replace(/(-\${env})/, ''), region)),
  ).toString();
}

function lambdaArnKey(name: string, region?: string): string {
  return `arn:aws:lambda:${region ? region : '${AWS::Region}'}:\${AWS::AccountId}:function:${name}`;
}

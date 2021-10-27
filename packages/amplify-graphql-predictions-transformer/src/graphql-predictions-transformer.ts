import * as path from 'path';
import { DirectiveWrapper, InvalidDirectiveError, MappingTemplate, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import * as appsync from '@aws-cdk/aws-appsync';
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { makeListType, makeNamedType, makeNonNullType, PredictionsResourceIDs, ResourceConstants } from 'graphql-transformer-common';
import {
  DirectiveNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
} from 'graphql';
import {
  comment,
  compoundExpression,
  forEach,
  HttpMappingTemplate,
  ifElse,
  iff,
  int,
  obj,
  print,
  qref,
  raw,
  ref,
  set,
  str,
  toJson,
} from 'graphql-mapping-template';
import { actionToDataSourceMap, actionToRoleAction, allowedActions } from './utils/action-maps';
import {
  amzJsonContentType,
  convertTextToSpeech,
  directiveDefinition,
  identifyEntities,
  identifyLabels,
  identifyLabelsAmzTarget,
  identifyText,
  identifyTextAmzTarget,
  translateText,
  translateTextAmzTarget,
  PREDICTIONS_DIRECTIVE_STACK,
} from './utils/constants';

type PredictionsDirectiveConfiguration = {
  actions: string[] | undefined;
  resolverFieldName: string;
  resolverTypeName: string;
};

export type PredictionsConfig = {
  bucketName: string;
};

export class PredictionsTransformer extends TransformerPluginBase {
  private directiveList: PredictionsDirectiveConfiguration[] = [];
  private bucketName: string;

  constructor(predictionsConfig?: PredictionsConfig) {
    super('amplify-predictions-transformer', directiveDefinition);
    this.bucketName = predictionsConfig?.bucketName ?? '';
  }

  field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    context: TransformerSchemaVisitStepContextProvider,
  ): void => {
    if (!this.bucketName) {
      throw new InvalidDirectiveError('Please configure storage in your project in order to use the @predictions directive');
    }

    if (parent.name.value !== context.output.getQueryTypeName()) {
      throw new InvalidDirectiveError('@predictions directive only works under Query operations.');
    }

    const directiveWrapped = new DirectiveWrapper(directive);
    const args = directiveWrapped.getArguments({
      resolverTypeName: parent.name.value,
      resolverFieldName: definition.name.value,
    } as PredictionsDirectiveConfiguration);

    if (!Array.isArray(args.actions)) {
      args.actions = [(args.actions as unknown) as string];
    }

    validateActions(args.actions);
    this.directiveList.push(args);
  };

  transformSchema = (context: TransformerTransformSchemaStepContextProvider): void => {
    this.directiveList.forEach(directive => {
      const actionInputObjectFields: InputValueDefinitionNode[] = [];
      let isList = false;

      directive.actions!.forEach((action, index) => {
        isList = needsList(action, isList);
        actionInputObjectFields.push(createInputValueAction(action, directive.resolverFieldName));

        // Add the input type to the schema if it does not already exist.
        if (!context.output.hasType(getActionInputName(action, directive.resolverFieldName))) {
          const actionInput = getActionInputType(action, directive.resolverFieldName, index === 0);

          context.output.addInput(actionInput);
        }
      });

      // Generate the input type based on operation name.
      context.output.addInput(makeActionInputObject(directive.resolverFieldName, actionInputObjectFields));

      // Add arguments into operation.
      const queryTypeName = context.output.getQueryTypeName() ?? '';
      const type = context.output.getType(queryTypeName) as ObjectTypeDefinitionNode;

      if (queryTypeName && type) {
        const fields = type.fields ?? [];
        const field = fields.find(f => f.name.value === directive.resolverFieldName);

        if (field) {
          const newFields = [
            ...fields.filter(f => f.name.value !== field.name.value),
            addInputArgument(field, directive.resolverFieldName, isList),
          ];
          const newMutation = {
            ...type,
            fields: newFields,
          };
          context.output.putType(newMutation);
        }
      }
    });
  };

  generateResolvers = (context: TransformerContextProvider): void => {
    if (this.directiveList.length === 0) {
      return;
    }

    const stack: cdk.Stack = context.stackManager.createStack(PREDICTIONS_DIRECTIVE_STACK);
    const env = context.stackManager.getParameter(ResourceConstants.PARAMETERS.Env) as cdk.CfnParameter;
    const createdResources = new Map<string, any>();
    const seenActions = new Set<string>();
    const role = new iam.Role(stack, PredictionsResourceIDs.iamRole, {
      roleName: joinWithEnv(context, '-', [PredictionsResourceIDs.iamRole, context.api.apiId]),
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
    });

    role.attachInlinePolicy(
      new iam.Policy(stack, 'PredictionsStorageAccess', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject'],
            resources: [getStorageArn(context, this.bucketName)],
          }),
        ],
      }),
    );

    new cdk.CfnCondition(stack, ResourceConstants.CONDITIONS.HasEnvironmentParameter, {
      expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(env, ResourceConstants.NONE)),
    });

    this.directiveList.forEach(directive => {
      const predictionFunctions: any[] = [];

      directive.actions!.forEach(action => {
        const datasourceName = actionToDataSourceMap.get(action) as string;
        const functionName = PredictionsResourceIDs.getPredictionFunctionName(action);
        const roleAction = actionToRoleAction.get(action);
        let datasource = context.api.host.getDataSource(datasourceName);

        if (roleAction && !seenActions.has(action)) {
          role.attachInlinePolicy(
            new iam.Policy(stack, `${action}Access`, {
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [roleAction],
                  resources: ['*'],
                }),
              ],
            }),
          );
        }

        seenActions.add(action);

        if (!datasource) {
          let predictionLambda;

          if (action === convertTextToSpeech) {
            predictionLambda = createPredictionsLambda(context, stack);
            role.attachInlinePolicy(
              new iam.Policy(stack, 'PredictionsLambdaAccess', {
                statements: [
                  new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['lambda:InvokeFunction'],
                    resources: [predictionLambda.functionArn],
                  }),
                ],
              }),
            );
          }

          datasource = createPredictionsDataSource(context, stack, action, role, predictionLambda);
        }

        // Add function configuration if it does not exist.
        let actionFunction = createdResources.get(functionName);

        if (!actionFunction) {
          actionFunction = createActionFunction(context, stack, action, datasource.name);
          createdResources.set(functionName, actionFunction);
        }

        predictionFunctions.push(actionFunction.functionId);
      });

      // Create AppSync resolver.
      createResolver(context, stack, directive, predictionFunctions, this.bucketName);
    });
  };
}

function validateActions(actions: string[]): void {
  if (actions.length === 0) {
    throw new InvalidDirectiveError('@predictions directive requires at least one action.');
  }

  let allowed: string[] | undefined = [];

  actions.forEach((action, index) => {
    if (index !== 0 && Array.isArray(allowed) && !allowed.includes(action)) {
      throw new InvalidDirectiveError(`${action} is not supported in this context!`);
    }

    allowed = allowedActions.get(action);
  });
}

function createPredictionsDataSource(
  context: TransformerContextProvider,
  stack: cdk.Stack,
  action: string,
  role: iam.Role,
  lambdaFn?: lambda.IFunction,
): appsync.LambdaDataSource | appsync.HttpDataSource {
  let datasource;

  switch (action) {
    case identifyEntities:
    case identifyText:
    case identifyLabels:
      datasource = context.api.host.addHttpDataSource(
        'RekognitionDataSource',
        cdk.Fn.sub('https://rekognition.${AWS::Region}.amazonaws.com'),
        {
          authorizationConfig: {
            signingRegion: cdk.Fn.sub('${AWS::Region}'),
            signingServiceName: 'rekognition',
          },
        } as appsync.DataSourceOptions,
        stack,
      );
      break;
    case translateText:
      datasource = context.api.host.addHttpDataSource(
        'TranslateDataSource',
        cdk.Fn.sub('https://translate.${AWS::Region}.amazonaws.com'),
        {
          authorizationConfig: {
            signingRegion: cdk.Fn.sub('${AWS::Region}'),
            signingServiceName: 'translate',
          },
        } as appsync.DataSourceOptions,
        stack,
      );
      break;
    case convertTextToSpeech:
    default:
      datasource = context.api.host.addLambdaDataSource(
        'LambdaDataSource',
        lambda.Function.fromFunctionAttributes(stack, 'LambdaDataSourceFunction', {
          functionArn: (lambdaFn as lambda.IFunction)?.functionArn,
        }),
        {},
        stack,
      );
      break;
  }

  datasource.ds.serviceRoleArn = role.roleArn;
  return datasource;
}

function createResolver(
  context: TransformerContextProvider,
  stack: cdk.Stack,
  config: PredictionsDirectiveConfiguration,
  pipelineFunctions: any[],
  bucketName: string,
): appsync.CfnResolver {
  const substitutions: { [key: string]: string } = {
    hash: cdk.Fn.select(3, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackName'))),
  };

  if (referencesEnv(bucketName)) {
    const env = context.stackManager.getParameter(ResourceConstants.PARAMETERS.Env) as cdk.CfnParameter;
    substitutions.env = (env as unknown) as string;
  }

  return context.api.host.addResolver(
    config.resolverTypeName,
    config.resolverFieldName,
    MappingTemplate.inlineTemplateFromString(
      (cdk.Fn.join('\n', [
        (cdk.Fn.conditionIf(
          ResourceConstants.CONDITIONS.HasEnvironmentParameter,
          cdk.Fn.sub(`$util.qr($ctx.stash.put("s3Bucket", "${bucketName}"))`, substitutions),
          cdk.Fn.sub(`$util.qr($ctx.stash.put("s3Bucket", "${removeEnvReference(bucketName)}"))`, {
            hash: cdk.Fn.select(3, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackName'))),
          }),
        ) as unknown) as string,
        print(compoundExpression([qref('$ctx.stash.put("isList", false)'), obj({})])),
      ]) as unknown) as string,
    ),
    MappingTemplate.inlineTemplateFromString(
      print(
        compoundExpression([
          comment('If the result is a list return the result as a list'),
          ifElse(
            ref('ctx.stash.get("isList")'),
            compoundExpression([set(ref('result'), ref('ctx.result.split("[ ,]+")')), toJson(ref('result'))]),
            toJson(ref('ctx.result')),
          ),
        ]),
      ),
    ),
    undefined,
    pipelineFunctions,
    stack,
  );
}

function createPredictionsLambda(context: TransformerContextProvider, stack: cdk.Stack): lambda.IFunction {
  const functionId = PredictionsResourceIDs.lambdaID;
  const role = new iam.Role(stack, PredictionsResourceIDs.lambdaIAMRole, {
    roleName: joinWithEnv(context, '-', [PredictionsResourceIDs.lambdaIAMRole, context.api.apiId]),
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    inlinePolicies: {
      PollyAccess: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['polly:SynthesizeSpeech'],
            resources: ['*'],
          }),
        ],
      }),
    },
  });

  // Update the runtime to Node 14 once the following issue is resolved:
  // https://github.com/aws-cloudformation/cloudformation-coverage-roadmap/issues/80#issuecomment-831796699
  return context.api.host.addLambdaFunction(
    PredictionsResourceIDs.lambdaHandlerName,
    `functions/${functionId}.zip`,
    PredictionsResourceIDs.lambdaHandlerName,
    path.join(__dirname, '..', 'lib', 'predictionsLambdaFunction.zip'),
    lambda.Runtime.NODEJS_12_X,
    [],
    role,
    {},
    cdk.Duration.seconds(PredictionsResourceIDs.lambdaTimeout),
    stack,
  );
}

function referencesEnv(value: string): boolean {
  return value.includes('${env}');
}

function removeEnvReference(value: string): string {
  return value.replace(/(-\${env})/, '');
}

function joinWithEnv(context: TransformerContextProvider, separator: string, listToJoin: any[]): string {
  const env = context.stackManager.getParameter(ResourceConstants.PARAMETERS.Env) as cdk.CfnParameter;
  return (cdk.Fn.conditionIf(
    ResourceConstants.CONDITIONS.HasEnvironmentParameter,
    cdk.Fn.join(separator, [...listToJoin, env]),
    cdk.Fn.join(separator, listToJoin),
  ) as unknown) as string;
}

function needsList(action: string, isCurrentlyList: boolean): boolean {
  switch (action) {
    case identifyLabels:
      return true;
    case convertTextToSpeech:
      return false;
    default:
      return isCurrentlyList;
  }
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getActionInputName(action: string, fieldName: string): string {
  return `${capitalizeFirstLetter(fieldName)}${capitalizeFirstLetter(action)}Input`;
}

function makeActionInputObject(fieldName: string, fields: InputValueDefinitionNode[]): InputObjectTypeDefinitionNode {
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    name: { kind: 'Name' as const, value: `${capitalizeFirstLetter(fieldName)}Input` },
    fields,
    directives: [],
  };
}

function createInputValueAction(action: string, fieldName: string): InputValueDefinitionNode {
  return {
    kind: Kind.INPUT_VALUE_DEFINITION,
    name: { kind: 'Name' as const, value: action },
    type: makeNonNullType(makeNamedType(getActionInputName(action, fieldName))),
    directives: [],
  };
}

function inputValueDefinition(inputValue: string, namedType: string, isNonNull: boolean = false): InputValueDefinitionNode {
  return {
    kind: Kind.INPUT_VALUE_DEFINITION,
    name: { kind: 'Name' as const, value: inputValue },
    type: isNonNull ? makeNonNullType(makeNamedType(namedType)) : makeNamedType(namedType),
    directives: [],
  };
}

function getActionInputType(action: string, fieldName: string, isFirst: boolean): InputObjectTypeDefinitionNode {
  const actionInputFields: { [action: string]: InputValueDefinitionNode[] } = {
    identifyText: [inputValueDefinition('key', 'String', true)],
    identifyLabels: [inputValueDefinition('key', 'String', true)],
    translateText: [
      inputValueDefinition('sourceLanguage', 'String', true),
      inputValueDefinition('targetLanguage', 'String', true),
      ...(isFirst ? [inputValueDefinition('text', 'String', true)] : []),
    ],
    convertTextToSpeech: [
      inputValueDefinition('voiceID', 'String', true),
      ...(isFirst ? [inputValueDefinition('text', 'String', true)] : []),
    ],
  };

  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    name: { kind: 'Name', value: getActionInputName(action, fieldName) },
    fields: actionInputFields[action],
    directives: [],
  };
}

function addInputArgument(field: FieldDefinitionNode, fieldName: string, isList: boolean): FieldDefinitionNode {
  return {
    ...field,
    arguments: [
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as const, value: 'input' },
        type: makeNonNullType(makeNamedType(`${capitalizeFirstLetter(fieldName)}Input`)),
        directives: [],
      },
    ],
    type: isList ? makeListType(makeNamedType('String')) : makeNamedType('String'),
  };
}

function s3ArnKey(name: string): string {
  return `arn:aws:s3:::${name}/public/*`;
}

function getStorageArn(context: TransformerContextProvider, bucketName: string): string {
  const substitutions: { [key: string]: string } = {
    hash: cdk.Fn.select(3, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackName'))),
  };

  if (referencesEnv(bucketName)) {
    const env = context.stackManager.getParameter(ResourceConstants.PARAMETERS.Env) as cdk.CfnParameter;
    substitutions.env = (env as unknown) as string;
  }

  return (cdk.Fn.conditionIf(
    ResourceConstants.CONDITIONS.HasEnvironmentParameter,
    cdk.Fn.sub(s3ArnKey(bucketName), substitutions),
    cdk.Fn.sub(s3ArnKey(removeEnvReference(bucketName)), { hash: cdk.Fn.select(3, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackName'))) }),
  ) as unknown) as string;
}

function createActionFunction(context: TransformerContextProvider, stack: cdk.Stack, action: string, datasourceName: string) {
  const httpPayload = `${action}Payload`;
  let actionFunctionResolver;

  switch (action) {
    case identifyText:
      actionFunctionResolver = {
        request: compoundExpression([
          set(ref('bucketName'), ref('ctx.stash.get("s3Bucket")')),
          set(ref('identityTextKey'), ref('ctx.args.input.identifyText.key')),
          set(
            ref(httpPayload),
            HttpMappingTemplate.postRequest({
              resourcePath: '/',
              params: obj({
                body: obj({
                  Image: obj({
                    S3Object: obj({
                      Bucket: str('$bucketName'),
                      Name: str('public/$identityTextKey'),
                    }),
                  }),
                }),
                headers: obj({
                  'Content-Type': str(amzJsonContentType),
                  'X-Amz-Target': str(identifyTextAmzTarget),
                }),
              }),
            }),
          ),
          toJson(ref(httpPayload)),
        ]),
        response: compoundExpression([
          iff(ref('ctx.error'), ref('util.error($ctx.error.message)')),
          ifElse(
            raw('$ctx.result.statusCode == 200'),
            compoundExpression([
              set(ref('results'), ref('util.parseJson($ctx.result.body)')),
              set(ref('finalResult'), str('')),
              forEach(/** for */ ref('item'), /** in */ ref('results.TextDetections'), [
                iff(raw('$item.Type == "LINE"'), set(ref('finalResult'), str('$finalResult$item.DetectedText '))),
              ]),
              ref('util.toJson($finalResult.trim())'),
            ]),
            ref('utils.error($ctx.result.body)'),
          ),
        ]),
      };
      break;

    case identifyLabels:
      actionFunctionResolver = {
        request: compoundExpression([
          set(ref('bucketName'), ref('ctx.stash.get("s3Bucket")')),
          set(ref('identifyLabelKey'), ref('ctx.args.input.identifyLabels.key')),
          qref('$ctx.stash.put("isList", true)'),
          set(
            ref(httpPayload),
            HttpMappingTemplate.postRequest({
              resourcePath: '/',
              params: obj({
                body: obj({
                  Image: obj({
                    S3Object: obj({
                      Bucket: str('$bucketName'),
                      Name: str('public/$identifyLabelKey'),
                    }),
                  }),
                  MaxLabels: int(10),
                  MinConfidence: int(55),
                }),
                headers: obj({
                  'Content-Type': str(amzJsonContentType),
                  'X-Amz-Target': str(identifyLabelsAmzTarget),
                }),
              }),
            }),
          ),
          toJson(ref(httpPayload)),
        ]),
        response: compoundExpression([
          iff(ref('ctx.error'), ref('util.error($ctx.error.message)')),
          ifElse(
            raw('$ctx.result.statusCode == 200'),
            compoundExpression([
              set(ref('labels'), str('')),
              set(ref('result'), ref('util.parseJson($ctx.result.body)')),
              forEach(/** for */ ref('label'), /** in */ ref('result.Labels'), [set(ref('labels'), str('$labels$label.Name, '))]),
              toJson(ref('labels.replaceAll(", $", "")')), // trim unnessary space
            ]),
            ref('util.error($ctx.result.body)'),
          ),
        ]),
      };
      break;

    case translateText:
      actionFunctionResolver = {
        request: compoundExpression([
          set(ref('text'), ref('util.defaultIfNull($ctx.args.input.translateText.text, $ctx.prev.result)')),
          set(
            ref(httpPayload),
            HttpMappingTemplate.postRequest({
              resourcePath: '/',
              params: obj({
                body: obj({
                  SourceLanguageCode: ref('ctx.args.input.translateText.sourceLanguage'),
                  TargetLanguageCode: ref('ctx.args.input.translateText.targetLanguage'),
                  Text: ref('text'),
                }),
                headers: obj({
                  'Content-Type': str(amzJsonContentType),
                  'X-Amz-Target': str(translateTextAmzTarget),
                }),
              }),
            }),
          ),
          toJson(ref(httpPayload)),
        ]),
        response: compoundExpression([
          iff(ref('ctx.error'), ref('util.error($ctx.error.message)')),
          ifElse(
            raw('$ctx.result.statusCode == 200'),
            compoundExpression([set(ref('result'), ref('util.parseJson($ctx.result.body)')), ref('util.toJson($result.TranslatedText)')]),
            ref('util.error($ctx.result.body)'),
          ),
        ]),
      };
      break;

    case convertTextToSpeech:
    default:
      actionFunctionResolver = {
        request: compoundExpression([
          set(ref('bucketName'), ref('ctx.stash.get("s3Bucket")')),
          qref('$ctx.stash.put("isList", false)'),
          set(ref('text'), ref('util.defaultIfNull($ctx.args.input.convertTextToSpeech.text, $ctx.prev.result)')),
          obj({
            version: str('2018-05-29'),
            operation: str('Invoke'),
            payload: toJson(
              obj({
                uuid: str('$util.autoId()'),
                action: str(convertTextToSpeech),
                voiceID: ref('ctx.args.input.convertTextToSpeech.voiceID'),
                text: ref('text'),
              }),
            ),
          }),
        ]),
        response: compoundExpression([
          iff(ref('ctx.error'), ref('util.error($ctx.error.message, $ctx.error.type)')),
          set(ref('response'), ref('util.parseJson($ctx.result)')),
          ref('util.toJson($ctx.result.url)'),
        ]),
      };
      break;
  }

  return context.api.host.addAppSyncFunction(
    `${action}Function`,
    MappingTemplate.inlineTemplateFromString(print(actionFunctionResolver.request)),
    MappingTemplate.inlineTemplateFromString(print(actionFunctionResolver.response)),
    datasourceName,
    stack,
  );
}

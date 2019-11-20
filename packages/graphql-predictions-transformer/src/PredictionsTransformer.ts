import {
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  DirectiveNode,
  valueFromASTUntyped,
  ArgumentNode,
  InputValueDefinitionNode,
  Kind,
} from 'graphql';
import { Transformer, gql, TransformerContext, InvalidDirectiveError } from 'graphql-transformer-core';
import { ResolverResourceIDs, PredictionsResourceIDs, makeNamedType, makeNonNullType, makeListType } from 'graphql-transformer-common';
import { getActionInputType, makeActionInputObject, getActionInputName, capitalizeFirstLetter } from './definitions';
import { allowedActions } from './predictions_utils';
import { Fn } from 'cloudform-types';
import { ResourceFactory, ActionPolicyMap } from './resources';
import path = require('path');

const PREDICTIONS_DIRECTIVE_STACK = 'PredictionsDirectiveStack';

export type PredictionsConfig = {
  bucketName: string;
};

export class PredictionsTransformer extends Transformer {
  resources: ResourceFactory;
  predictionsConfig: PredictionsConfig;

  constructor(predictionsConfig: PredictionsConfig) {
    super(
      'PredictionsTransformer',
      gql`
        # where the parent this field is defined on is a query type
        directive @predictions(actions: [PredictionsActions!]!) on FIELD_DEFINITION
        enum PredictionsActions {
          identifyText
          identifyLabels
          convertTextToSpeech
          translateText
        }
      `
    );
    this.resources = new ResourceFactory();
    this.predictionsConfig = predictionsConfig;
  }

  public field = (parent: ObjectTypeDefinitionNode, definition: FieldDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
    // validate @predictions is defined on a field under a query object
    if (parent.name.value !== ctx.getQueryTypeName()) {
      throw new InvalidDirectiveError('@predictions directive only works under Query operations.');
    }

    // get input arguments
    const actions = this.getActions(directive);
    const storage = this.predictionsConfig.bucketName;

    // validate that that order the transformers are correct
    this.validate(actions, storage);

    // make changes to the schema to create the input/output types
    // generate action datasources and add functions
    this.createResources(ctx, definition, actions, storage);
  }

  private validate(actions: string[], storage: string) {
    // validate actions
    const supportedPredictions = allowedActions;
    const allowed = [];
    actions.forEach(action => {
      if (supportedPredictions[action] && (allowed.includes(action) || allowed.length === 0)) {
        allowed.concat(supportedPredictions[action].next);
      } else {
        throw new InvalidDirectiveError(`${action} is not supported!`);
      }
    });
    // validate that storage is added in the project
    if(!storage) {
      throw new InvalidDirectiveError('Storage must be enabled before using @predictions');
    }
  }

  private createResources(ctx: TransformerContext, def: FieldDefinitionNode, actions: string[], storage: string) {
    const fieldName = def.name.value;
    const predictionFunctions: any[] = [];
    const actionInputObjectFields: InputValueDefinitionNode[] = [];
    let isList: boolean = false;
    let actionPolicyMap: ActionPolicyMap = {};
    if (ctx.metadata.has(PredictionsResourceIDs.getActionMapID())) {
      actionPolicyMap = ctx.metadata.get(PredictionsResourceIDs.getActionMapID());
    }
    actions.forEach((action, index) => {
      // boolean to check if the action specified is the first action
      const isFirst = index === 0;
      // check if action should return a list
      isList = this.needsList(action, isList);
      // create input object fields which will end up in the input object
      actionInputObjectFields.push(this.createInputValueAction(action, fieldName));
      // create policy for action if it doesn't exist
      actionPolicyMap = this.resources.mergeActionRole(actionPolicyMap, action);
      // grab datasource config for the action
      const actionDSConfig = this.resources.getPredictionsDSConfig(action);
      // add the action function into the pipeline resolver for the operation resolver
      predictionFunctions.push(Fn.GetAtt(PredictionsResourceIDs.getPredictionFunctionName(action), 'FunctionId'));
      // if the datasource does not exist add the resource
      if (!ctx.getResource(actionDSConfig.id)) {
        ctx.setResource(actionDSConfig.id, this.resources.createPredictionsDataSource(actionDSConfig));
        ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, actionDSConfig.id);
        if (actionDSConfig.id === 'LambdaDataSource') {
          // merge lambda permission
          actionPolicyMap = this.resources.mergeLambdaActionRole(actionPolicyMap);
          // add lambda function in transformer context metadata
          ctx.metadata.set(PredictionsResourceIDs.getLambdaID(), path.resolve(`${__dirname}/../lib/predictionsLambdaFunction.zip`));
          // TODO: If other actions should use a lambda function then the iam role should add as needed policies per action
          ctx.setResource(PredictionsResourceIDs.getLambdaIAMRole(), this.resources.createLambdaIAMRole(storage));
          ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.getLambdaIAMRole());
          // create lambda function
          ctx.setResource(PredictionsResourceIDs.getLambdaID(), this.resources.createPredictionsLambda());
          ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.getLambdaID());
        }
      }
      // add function configuration resource if it does not exist
      if (!ctx.getResource(PredictionsResourceIDs.getPredictionFunctionName(action))) {
        ctx.setResource(
          PredictionsResourceIDs.getPredictionFunctionName(action),
          this.resources.createActionFunction(action, actionDSConfig.id)
        );
        ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.getPredictionFunctionName(action));
      }
      // check if the input type exists in the schema
      if (!this.typeExist(getActionInputName(action, fieldName), ctx)) {
        const actionInput = getActionInputType(action, fieldName, isFirst);
        ctx.addInput(actionInput);
      }
    });

    // create iam policy
    const iamRole = this.resources.createIAMRole(actionPolicyMap, storage);
    ctx.setResource(PredictionsResourceIDs.getIAMRole(), iamRole);
    ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.getIAMRole());
    // save map config in the context
    ctx.metadata.set(PredictionsResourceIDs.getActionMapID(), actionPolicyMap);

    // generate input type based on operation name
    ctx.addInput(makeActionInputObject(capitalizeFirstLetter(fieldName), actionInputObjectFields));
    // add arguments into operation
    const type = ctx.getType(ctx.getQueryTypeName()) as ObjectTypeDefinitionNode;
    if (type) {
      const field = type.fields.find(f => f.name.value === fieldName);
      if (field) {
        const newFields = [...type.fields.filter(f => f.name.value !== field.name.value), this.addInputArgument(field, fieldName, isList)];
        const newMutation = {
          ...type,
          fields: newFields,
        };
        ctx.putType(newMutation);
      }
    }

    // create the resolver for the operation
    const resolver = this.resources.createResolver(ctx.getQueryTypeName(), def.name.value, predictionFunctions, storage);
    const resolverId = ResolverResourceIDs.ResolverResourceID(ctx.getQueryTypeName(), def.name.value);
    ctx.setResource(resolverId, resolver);
    ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, resolverId);
  }

  private getActions(directive: DirectiveNode): string[] {
    const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s;
    const getArg = (arg: string, dflt?: any) => {
      const argument = directive.arguments.find(get(arg));
      return argument ? valueFromASTUntyped(argument.value) : dflt;
    };
    return getArg('actions', []) as string[];
  }

  private needsList(action: string, flag: boolean): boolean {
    switch (action) {
      case 'identifyLabels':
        return true;
      case 'convertTextToSpeech':
        return false;
      default:
        return flag;
    }
  }

  private createInputValueAction(action: string, fieldName: string): InputValueDefinitionNode {
    return {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: { kind: 'Name' as 'Name', value: `${action}` },
      type: makeNonNullType(makeNamedType(getActionInputName(action, fieldName))),
      directives: [],
    };
  }

  private addInputArgument(field: FieldDefinitionNode, fieldName: string, isList: boolean): FieldDefinitionNode {
    return {
      ...field,
      arguments: [
        {
          kind: Kind.INPUT_VALUE_DEFINITION,
          name: { kind: 'Name' as 'Name', value: 'input' },
          type: makeNonNullType(makeNamedType(`${capitalizeFirstLetter(fieldName)}Input`)),
          directives: [],
        },
      ],
      type: isList ? makeListType(makeNamedType('String')) : makeNamedType('String'),
    };
  }

  private typeExist(type: string, ctx: TransformerContext): boolean {
    return Boolean(type in ctx.nodeMap);
  }
}

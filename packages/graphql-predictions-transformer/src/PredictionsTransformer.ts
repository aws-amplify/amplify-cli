import {
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  DirectiveNode,
  valueFromASTUntyped,
  ArgumentNode,
  InputValueDefinitionNode,
} from 'graphql';
import { getActionInputType, makeActionInputObject, getActionInputName, addInputArgument, createInputValueAction } from './definitions';
import { Transformer, gql, TransformerContext, InvalidDirectiveError } from 'graphql-transformer-core';
import { ResolverResourceIDs, PredictionsResourceIDs } from 'graphql-transformer-common';
import { ResourceFactory, ActionPolicyMap } from './resources';
import { allowedActions } from './predictions_utils';
import { Fn } from 'cloudform-types';
import path = require('path');

const PREDICTIONS_DIRECTIVE_STACK = 'PredictionsDirectiveStack';

export type PredictionsConfig = {
  bucketName: string;
};

export class PredictionsTransformer extends Transformer {
  resources: ResourceFactory;
  predictionsConfig: PredictionsConfig;

  constructor(predictionsConfig?: PredictionsConfig) {
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
    // validate that that order the transformers are correct
    this.validateActions(actions);
    // validate storage is in the config
    if ( !(this.predictionsConfig) || !(this.predictionsConfig.bucketName) ) {
      throw new InvalidDirectiveError('Please configure storage in your project in order to use @predictions directive');
    }

    // make changes to the schema to create the input/output types
    // generate action datasources and add functions
    this.createResources(ctx, definition, actions, this.predictionsConfig.bucketName);
  }

  private validateActions(actions: string[]) {
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
  }

  private createResources(ctx: TransformerContext, def: FieldDefinitionNode, actions: string[], storage: string) {
    const fieldName = def.name.value;
    const predictionFunctions: any[] = [];
    const actionInputObjectFields: InputValueDefinitionNode[] = [];
    let isList: boolean = false;
    let actionPolicyMap: ActionPolicyMap = {};
    if (ctx.metadata.has(PredictionsResourceIDs.actionMapID)) {
      actionPolicyMap = ctx.metadata.get(PredictionsResourceIDs.actionMapID);
    }
    actions.forEach((action, index) => {
      // boolean to check if the action specified is the first action
      const isFirst = index === 0;
      // check if action should return a list
      isList = this.needsList(action, isList);
      // create input object fields which will end up in the input object
      actionInputObjectFields.push(createInputValueAction(action, fieldName));
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
          // merge lambda permissions
          actionPolicyMap = this.resources.mergeLambdaActionRole(actionPolicyMap);
          // add lambda function in transformer context metadata
          ctx.metadata.set(PredictionsResourceIDs.lambdaID, path.resolve(`${__dirname}/../lib/predictionsLambdaFunction.zip`));
          // TODO: If other actions should use a lambda function then the iam role should add as needed policies per action
          ctx.setResource(PredictionsResourceIDs.lambdaIAMRole, this.resources.createLambdaIAMRole(storage));
          ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.lambdaIAMRole);
          // create lambda function
          ctx.setResource(PredictionsResourceIDs.lambdaID, this.resources.createPredictionsLambda());
          ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.lambdaID);
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
    ctx.setResource(PredictionsResourceIDs.iamRole, iamRole);
    ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.iamRole);
    // save map config in the context
    ctx.metadata.set(PredictionsResourceIDs.actionMapID, actionPolicyMap);

    // generate input type based on operation name
    ctx.addInput(makeActionInputObject(fieldName, actionInputObjectFields));
    // add arguments into operation
    const type = ctx.getType(ctx.getQueryTypeName()) as ObjectTypeDefinitionNode;
    if (type) {
      const field = type.fields.find(f => f.name.value === fieldName);
      if (field) {
        const newFields = [...type.fields.filter(f => f.name.value !== field.name.value), addInputArgument(field, fieldName, isList)];
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

  private typeExist(type: string, ctx: TransformerContext): boolean {
    return Boolean(type in ctx.nodeMap);
  }
}

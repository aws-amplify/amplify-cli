import { ObjectTypeDefinitionNode, FieldDefinitionNode, DirectiveNode, valueFromASTUntyped, ArgumentNode, InputValueDefinitionNode, Kind } from 'graphql';
import { Transformer, gql, TransformerContext, InvalidDirectiveError } from 'graphql-transformer-core';
import { ResolverResourceIDs, PredictionsResourceIDs, makeNamedType, makeNonNullType } from 'graphql-transformer-common';
import { actionInputFunctions, makeActionInputObject } from './definitions';
import { allowedActions } from './predictions_utils';
import { Fn } from 'cloudform-types';
import { ResourceFactory } from './resources';
import path = require('path');

const PREDICTIONS_DIRECTIVE_STACK = 'PredictionsDirectiveStack';

export class PredictionsTransformer extends Transformer {
  resources: ResourceFactory;

  constructor() {
    super(
      'PredictionsTransformer',
      gql`
        # where the parent this field is defined on is a query type
        directive @predictions(actions: [PredictionsActions!]! storage: String!) on FIELD_DEFINITION
        enum PredictionsActions {
          identifyText
          convertTextToSpeech
          translateText
          # identifyCelebrities # currently limited to just celebrities
          # identifyLabels
        }
      `
    );
    this.resources = new ResourceFactory();
  }

  public field = (
    parent: ObjectTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    ctx: TransformerContext,
  ) => {
    // validate @predictions is defined on a field under a query object
    if (parent.name.value !== ctx.getQueryTypeName()) {
      throw new InvalidDirectiveError('@predictions directive only works under Query operations.');
    }
    
    // get input arguments
    const actions = this.getActions(directive);
    const storage = this.getStorage(directive);

    // validate that that order the transformers are correct
    this.validate(actions, storage);

    // generate an IAM role based off the actions
    const iamRole = this.resources.createIAMRole(actions, storage);
    ctx.setResource(PredictionsResourceIDs.getIAMRole(), iamRole);
    ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.getIAMRole());

    // make changes to the schema to create the input/output types
    // this.createActionTypes(ctx, definition, actions);
    // generate action datasources and add functions
    this.createResources(ctx, definition, actions, storage);
  }


  private validate(actions: string[], storage: string) {
    // validate actions
    const supportedPredictions = allowedActions;
    const allowed = [];
    actions.forEach( (action) => {
      if (supportedPredictions[action] && (allowed.includes(action) || allowed.length === 0)) {
          allowed.concat(supportedPredictions[action].next);
      } else {
          throw new InvalidDirectiveError(`${action} is not supported!`);
      }
    });
    // validate storage name
    const regexp = new RegExp('^[a-z0-9-]+$');
    if(!regexp.test(storage)) {
      throw new InvalidDirectiveError(`Storage name can only use the following characters: a-z 0-9 -`);
    }
  }

  private createResources(ctx: TransformerContext, def: FieldDefinitionNode, actions: string[], storage: string) {
    const fieldName = def.name.value;
    const predictionFunctions: any[] = [];
    const actionInputObjectFields: InputValueDefinitionNode[] = [];
    actions.forEach( (action, index) => {
      // boolean to check if the action specified is the first action
      const isFirst = index === 0;
      // create input object fields which will end up in the input object
      actionInputObjectFields.push(this.createInputValueAction(action));
      // grab datasource config for the action
      const actionDSConfig = this.resources.getPredictionsDSConfig(action);
      // add the action function into the pipeline resolver for the operation resolver
      predictionFunctions.push(Fn.GetAtt(PredictionsResourceIDs.getPredictionFunctionName(action), 'FunctionId'));
      // if the datasource does not exist add the resource
      if (!ctx.getResource(actionDSConfig.id)) {
        ctx.setResource(actionDSConfig.id, this.resources.createPredictionsDataSource(actionDSConfig));
        ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, actionDSConfig.id);
        if (actionDSConfig.id === 'LambdaDataSource') {
          // add lambda function in transformer context metadata
          ctx.metadata.set(PredictionsResourceIDs.getLambdaID(), path.resolve(`${__dirname}/../lib/predictionsLambdaFunction.zip`));
          // TODO: If other actions should use a lambda function then the iam role should add as needed policies per action
          ctx.setResource(PredictionsResourceIDs.getLambdaIAMRole(), this.resources.createLambdaIAMRole());
          ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.getLambdaIAMRole());
          // create lambda function
          ctx.setResource(PredictionsResourceIDs.getLambdaID(), this.resources.createPredictionsLambda());
          ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.getLambdaID());
        }
      }
      // add function configuration resource if it does not exist
      if (!ctx.getResource(PredictionsResourceIDs.getPredictionFunctionName(action))) {
        ctx.setResource(PredictionsResourceIDs.getPredictionFunctionName(action),
          this.resources.createActionFunction(action, storage, actionDSConfig.id));
        ctx.mapResourceToStack(PREDICTIONS_DIRECTIVE_STACK, PredictionsResourceIDs.getPredictionFunctionName(action));
      }
      // check if the input type exists in the schema
      if(!this.typeExist(`${this.capitalizeFirstLetter(action)}Input`, ctx)) {
        const actionInput = actionInputFunctions[action](isFirst);
        ctx.addInput(actionInput);
      }
    });

    // generate input type based on operation name
    ctx.addInput(makeActionInputObject(this.capitalizeFirstLetter(fieldName), actionInputObjectFields));
    // add arguments into operation
    const type = ctx.getType(ctx.getQueryTypeName()) as ObjectTypeDefinitionNode;
    if (type) {
      const field = type.fields.find(f => f.name.value === fieldName);
      if (field) {
        const newFields = [...type.fields.filter(f => f.name.value !== field.name.value), this.addInputArgument(field, fieldName)];
        const newMutation = {
          ...type,
          fields: newFields,
        };
        ctx.putType(newMutation);
      }
    }

    // create the resolver for the operation
    const resolver = this.resources.createResolver(ctx.getQueryTypeName(), def.name.value, predictionFunctions);
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

  private getStorage(directive: DirectiveNode): string {
    const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s;
    const getArg = (arg: string, dflt?: any) => {
      const argument = directive.arguments.find(get(arg));
      return argument ? valueFromASTUntyped(argument.value) : dflt;
    };
    return getArg('storage', []) as string;
  }
  // TODO check if not needed then remove
  // private createActionTypes(ctx: TransformerContext, def: FieldDefinitionNode, actions: string[]) {
  //   // iterate through each action and generate necessary types for that action
  //   const fieldName = def.name.value;
  //   const actionInputObjectFields: InputValueDefinitionNode[] = [];
  //   actions.forEach( (action, index) => {
  //     const isFirst = index === 0;
  //     const actionUpper = this.capitalizeFirstLetter(action);
  //     actionInputObjectFields.push(this.createInputValueAction(action));
  //     if(!this.typeExist(`${actionUpper}Input`, ctx)) {
  //       const actionInput = actionInputFunctions[action](isFirst);
  //       ctx.addInput(actionInput);
  //     }
  //   });
  //   // generate input type based on operation name
  //   ctx.addInput(makeActionInputObject(this.capitalizeFirstLetter(fieldName), actionInputObjectFields));
  //   // add arguments into operation
  //   const type = ctx.getType(ctx.getQueryTypeName()) as ObjectTypeDefinitionNode;
  //   if (type) {
  //     const field = type.fields.find(f => f.name.value === fieldName);
  //     if (field) {
  //       const newFields = [...type.fields.filter(f => f.name.value !== field.name.value), this.addInputArgument(field, fieldName)];
  //       const newMutation = {
  //         ...type,
  //         fields: newFields,
  //       };
  //       ctx.putType(newMutation);
  //     }
  //   }
  // }

  private capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private createInputValueAction(action: string): InputValueDefinitionNode {
    return {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: { kind: 'Name' as 'Name', value: `${action}` },
      type: makeNonNullType(makeNamedType(`${this.capitalizeFirstLetter(action)}Input`)),
      directives: [],
    };
  }

  private addInputArgument(field: FieldDefinitionNode, fieldName: string): FieldDefinitionNode {
    return {
      ...field,
      arguments: [{
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as 'Name', value: 'input' },
        type: makeNonNullType(makeNamedType(`${this.capitalizeFirstLetter(fieldName)}Input`)),
        directives: []
      }],
      type: makeNamedType(`String`),
    };
  }

  private typeExist(type: string, ctx: TransformerContext): boolean {
    return Boolean(type in ctx.nodeMap);
  }
}

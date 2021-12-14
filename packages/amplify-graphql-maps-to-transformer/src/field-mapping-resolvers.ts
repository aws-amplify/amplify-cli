import { MappingTemplate } from '@aws-amplify/graphql-transformer-core';
import { TransformerResolverProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { compoundExpression, Expression, forEach, methodCall, print, qref, raw, ref, str, toJson } from 'graphql-mapping-template';

/**
 * Contains functions for mapping relational fields of renamed models to their original name
 */

type CreateMutationMappingParams = {
  mutationResolver: TransformerResolverProvider; // The create or update resolver that needs a mapping added to it
  mutationFieldName: string; // The create or update resolver name
  origAttrName: string; // The original foreign key attribute name
  currAttrName: string; // The current foreign key attribute name
};

/**
 * Adds an 'init' slot to the given resolver that maps currAttrName to origAttrName in the incoming request
 */
export const createMutationMapping = ({
  mutationResolver,
  mutationFieldName,
  origAttrName,
  currAttrName,
}: CreateMutationMappingParams): void => {
  mutationResolver.addToSlot(
    'init',
    MappingTemplate.s3MappingTemplateFromString(
      print(
        compoundExpression([
          qref(methodCall(ref('ctx.args.input.put'), str(origAttrName), ref(`ctx.args.input.${currAttrName}`))),
          qref(methodCall(ref('ctx.args.input.remove'), str(currAttrName))),
        ]),
      ),
      `Mutation.${mutationFieldName}.{slotName}.{slotIndex}.req.vtl`,
    ),
  );
};

type CreatePostDataLoadMappingParams = {
  resolver: TransformerResolverProvider; // The get / list / field resolver
  resolverFieldName: string; // The resolver field name
  resolverTypeName: string; // The resolver type name
  origAttrName: string; // The original foreign key attribute name
  currAttrName: string; // The current foreign key attribute name
  isList: boolean; // true if the previous pipeline function is expected to return a list, false otherwise. Specifically, $ctx.prev.result.items is expected to be a list if true
};
/**
 * Adds a 'postDataLoad' slot to the given a resolver that maps origAttrName to currAttrName in the outgoing result
 */
export const createPostDataLoadMapping = ({
  resolver,
  resolverFieldName,
  resolverTypeName,
  origAttrName,
  currAttrName,
  isList,
}: CreatePostDataLoadMappingParams): void => {
  resolver.addToSlot(
    'postDataLoad',
    undefined,
    MappingTemplate.s3MappingTemplateFromString(
      print(
        compoundExpression([
          isList
            ? createListRemapExpression('ctx.prev.result.items', origAttrName, currAttrName)
            : createSingleRemapExpression('ctx.prev.result', origAttrName, currAttrName),
          toJson(ref('ctx.prev.result')),
        ]),
      ),
      `${resolverTypeName}.${resolverFieldName}.{slotName}.{slotIndex}.res.vtl`,
    ),
  );
};

type CreateReadInitMappingParams = {
  resolver: TransformerResolverProvider; // The field resolver
  resolverFieldName: string; // The resolver field name
  resolverTypeName: string; // The resolver type name
  origAttrName: string; // The original foreign key attribute name
  currAttrName: string; // The current foreign key attribute name
};

export const createReadFieldInitMapping = ({
  resolver,
  resolverFieldName,
  resolverTypeName,
  origAttrName,
  currAttrName,
}: CreateReadInitMappingParams) => {
  resolver.addToSlot(
    'init',
    MappingTemplate.s3MappingTemplateFromString(
      print(compoundExpression([createSingleRemapExpression('ctx.source', currAttrName, origAttrName), toJson(raw('{}'))])),
      `${resolverTypeName}.${resolverFieldName}.{slotName}.{slotIndex}.req.vtl`,
    ),
  );
};

const createListRemapExpression = (resultListName: string, sourceAttrName: string, destAttrName: string): Expression =>
  forEach(ref('item'), ref(resultListName), [createSingleRemapExpression('item', sourceAttrName, destAttrName)]);

//
const createSingleRemapExpression = (resultMapName: string, sourceAttrName: string, destAttrName: string): Expression =>
  qref(methodCall(ref(`${resultMapName}.put`), str(destAttrName), ref(`${resultMapName}.${sourceAttrName}`)));

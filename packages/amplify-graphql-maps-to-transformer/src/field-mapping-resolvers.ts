import { MappingTemplate } from '@aws-amplify/graphql-transformer-core';
import { TransformerResolverProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { FieldMap } from '@aws-amplify/graphql-transformer-interfaces/src/transformer-context/resource-resource-provider';
import { compoundExpression, Expression, forEach, methodCall, print, qref, raw, ref, str, toJson } from 'graphql-mapping-template';

/**
 * Contains functions that generate VTL to to map renamed fields of models to their original name
 */

type AttachInputMappingSlotParams = {
  resolver: TransformerResolverProvider; // The create or update resolver that needs a mapping added to it
  resolverTypeName: string; // The resolver type name
  resolverFieldName: string; // The create or update resolver name
  fieldMap: FieldMap; // A map of renamed fields
};

/**
 * Adds an init slot to the given resolver that maps currAttrName to origAttrName in the incoming request
 * Calls createPostDataLoadMapping to create a slot to map origAttrName back to currAttrName in the response
 */
export const attachInputMappingSlot = ({ resolver, resolverTypeName, resolverFieldName, fieldMap }: AttachInputMappingSlotParams): void => {
  resolver.addToSlot(
    'init',
    MappingTemplate.s3MappingTemplateFromString(
      print(compoundExpression([createMultiRemapExpression('ctx.args.input', fieldMap, 'CURR_TO_ORIG'), toJson(raw('{}'))])),
      `${resolverTypeName}.${resolverFieldName}.{slotName}.{slotIndex}.req.vtl`,
    ),
  );
};

type AttachResponseMappingSlotParams = {
  slotName: 'postDataLoad' | 'postUpdate'; // the slot to insert into
  resolver: TransformerResolverProvider; // The get / list / field resolver
  resolverFieldName: string; // The resolver field name
  resolverTypeName: string; // The resolver type name
  fieldMap: FieldMap;
  isList: boolean; // true if the previous pipeline function is expected to return a list, false otherwise. Specifically, $ctx.prev.result.items is expected to be a list if true
};

/**
 * Attaches either a postDataLoad or finish slot to the given resolver. The template maps the original foreign key name to current foreign key name in the result object
 * @param slotName Which slot type to insert
 */
export const attachResponseMappingSlot = ({
  slotName,
  resolver,
  resolverFieldName,
  resolverTypeName,
  fieldMap,
  isList,
}: AttachResponseMappingSlotParams) => {
  resolver.addToSlot(
    slotName,
    undefined,
    MappingTemplate.s3MappingTemplateFromString(
      print(
        compoundExpression([
          isList
            ? createListRemapExpression('ctx.prev.result.items', fieldMap, 'ORIG_TO_CURR')
            : createMultiRemapExpression('ctx.prev.result', fieldMap, 'ORIG_TO_CURR'),
          toJson(ref('ctx.prev.result')),
        ]),
      ),
      `${resolverTypeName}.${resolverFieldName}.{slotName}.{slotIndex}.res.vtl`,
    ),
  );
};

const createListRemapExpression = (resultListName: string, fieldMap: FieldMap, direction: 'ORIG_TO_CURR' | 'CURR_TO_ORIG'): Expression =>
  forEach(ref('item'), ref(resultListName), [createMultiRemapExpression('item', fieldMap, direction)]);

const createMultiRemapExpression = (vtlMapName: string, fieldMap: FieldMap, direction: 'ORIG_TO_CURR' | 'CURR_TO_ORIG') => {
  const expressions: Expression[] = [];
  fieldMap.forEach((origFieldName, currentFieldName) => {
    if (direction === 'ORIG_TO_CURR') {
      expressions.push(createRemapExpression(vtlMapName, origFieldName, currentFieldName));
    } else {
      expressions.push(createRemapExpression(vtlMapName, currentFieldName, origFieldName));
    }
  });
  return compoundExpression(expressions);
};

const createRemapExpression = (vtlMapName: string, sourceAttrName: string, destAttrName: string): Expression =>
  compoundExpression([
    qref(methodCall(ref(`${vtlMapName}.put`), str(destAttrName), ref(`${vtlMapName}.${sourceAttrName}`))),
    qref(methodCall(ref(`${vtlMapName}.remove`), str(sourceAttrName))),
  ]);

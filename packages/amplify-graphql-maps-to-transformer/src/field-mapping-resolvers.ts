import { MappingTemplate } from '@aws-amplify/graphql-transformer-core';
import { TransformerResolverProvider, FieldMapEntry, ReadonlyArray } from '@aws-amplify/graphql-transformer-interfaces';
import { LambdaDataSource } from '@aws-cdk/aws-appsync';
import {
  and,
  compoundExpression,
  Expression,
  forEach,
  iff,
  methodCall,
  obj,
  or,
  print,
  qref,
  raw,
  ref,
  ret,
  set,
  str,
  toJson,
} from 'graphql-mapping-template';
import { setTransformedArgs } from 'graphql-transformer-common';

/**
 * Contains functions that generate VTL to to map renamed fields of models to their original name
 */

type AttachInputMappingSlotParams = {
  resolver: TransformerResolverProvider; // The create or update resolver that needs a mapping added to it
  resolverTypeName: string; // The resolver type name
  resolverFieldName: string; // The create or update resolver name
  fieldMap: ReadonlyArray<FieldMapEntry>; // A map of renamed fields
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
  fieldMap: ReadonlyArray<FieldMapEntry>;
  isList: boolean; // true if the previous pipeline function is expected to return a list, false otherwise. Specifically, $ctx.prev.result.items is expected to be a list if true
};

/**
 * Attaches either a postDataLoad or postUpdate slot to the given resolver. The template maps the original foreign key name to current foreign key name in the result object
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

type AttachFilterConditionInputMappingSlotParams = {
  slotName: 'preUpdate' | 'preDataLoad';
  resolver: TransformerResolverProvider; // The create or update resolver that needs a mapping added to it
  resolverTypeName: string; // The resolver type name
  resolverFieldName: string; // The create or update resolver name
  fieldMap: ReadonlyArray<FieldMapEntry>; // A map of renamed fields
  dataSource: LambdaDataSource;
};

export const attachFilterAndConditionInputMappingSlot = ({
  slotName,
  resolver,
  resolverTypeName,
  resolverFieldName,
  fieldMap,
  dataSource,
}: AttachFilterConditionInputMappingSlotParams) => {
  const fieldMapVtl = fieldMap.reduce((acc, { originalFieldName, currentFieldName }) => {
    acc[currentFieldName] = originalFieldName;
    return acc;
  }, {} as Record<string, string>);
  const fieldMapRef = ref('fieldMap');
  resolver.addToSlot(
    slotName,
    MappingTemplate.s3MappingTemplateFromString(
      print(
        compoundExpression([
          set(fieldMapRef, raw(JSON.stringify(fieldMapVtl))),
          iff(or([methodCall(ref('util.isNull'), fieldMapRef), raw('$fieldMap.keySet().size() <= 0')]), ret(ref('ctx.args'))),
          iff(
            and([methodCall(ref('util.isNull'), ref('ctx.args.filter')), methodCall(ref('util.isNull'), ref('ctx.args.condition'))]),
            ret(ref('ctx.args')),
          ),
          set(
            ref('invoke'),
            obj({
              operation: str('Invoke'),
              payload: obj({
                args: ref('ctx.args'),
                fieldMap: fieldMapRef,
              }),
            }),
          ),
          toJson(ref('invoke')),
        ]),
      ),
      `${resolverTypeName}.${resolverFieldName}.{slotName}.{slotIndex}.req.vtl`,
    ),
    MappingTemplate.s3MappingTemplateFromString(
      print(
        compoundExpression([
          iff(ref('ctx.error'), methodCall(ref('util.error'), ref('ctx.error.message'), ref('ctx.error.type'))),
          setTransformedArgs(ref('ctx.result')),
          toJson(raw('{}')),
        ]),
      ),
      `${resolverTypeName}.${resolverFieldName}.{slotName}.{slotIndex}.res.vtl`,
    ),
    dataSource,
  );
};

const createListRemapExpression = (
  resultListName: string,
  fieldMap: ReadonlyArray<FieldMapEntry>,
  direction: 'ORIG_TO_CURR' | 'CURR_TO_ORIG',
): Expression => forEach(ref('item'), ref(resultListName), [createMultiRemapExpression('item', fieldMap, direction)]);

const createMultiRemapExpression = (
  vtlMapName: string,
  fieldMap: ReadonlyArray<FieldMapEntry>,
  direction: 'ORIG_TO_CURR' | 'CURR_TO_ORIG',
) => {
  const expressions: Expression[] = [];
  fieldMap.forEach(({ originalFieldName, currentFieldName }) => {
    if (direction === 'ORIG_TO_CURR') {
      expressions.push(createRemapExpression(vtlMapName, originalFieldName, currentFieldName));
    } else {
      expressions.push(createRemapExpression(vtlMapName, currentFieldName, originalFieldName));
    }
  });
  return compoundExpression(expressions);
};

const createRemapExpression = (vtlMapName: string, sourceAttrName: string, destAttrName: string): Expression =>
  compoundExpression([
    qref(methodCall(ref(`${vtlMapName}.put`), str(destAttrName), ref(`${vtlMapName}.${sourceAttrName}`))),
    qref(methodCall(ref(`${vtlMapName}.remove`), str(sourceAttrName))),
  ]);

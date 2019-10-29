import {
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  Kind,
  print,
} from 'graphql';
import {
  makeInputValueDefinition,
  makeNonNullType,
  makeNamedType,
  ModelResourceIDs,
  isScalar,
  getBaseType,
  withNamedNodeNamed,
  makeArgument,
  STANDARD_SCALARS,
  unwrapNonNull,
} from 'graphql-transformer-common';
import { TransformerContext } from 'graphql-transformer-core';

export function makeHttpArgument(name: string, inputType: InputObjectTypeDefinitionNode, makeNonNull: boolean): InputValueDefinitionNode {
  // the URL params type that we create will need to be non-null, so build in some flexibility here
  const type = makeNonNull ? makeNonNullType(makeNamedType(inputType.name.value)) : makeNamedType(inputType.name.value);
  return makeInputValueDefinition(name, type);
}

export function makeUrlParamInputObject(
  parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
  field: FieldDefinitionNode,
  urlParams: string[]
): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.UrlParamsInputObjectName(parent.name.value, field.name.value);
  const urlParamFields = urlParams.map((param: string) => {
    return makeInputValueDefinition(param, makeNonNullType(makeNamedType('String')));
  });
  console.log(`urlParamInputObject has these fields: ${print(urlParamFields)}`);
  const fields: InputValueDefinitionNode[] = urlParamFields;
  return {
    kind: 'InputObjectTypeDefinition',
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeHttpQueryInputObject(
  parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
  field: FieldDefinitionNode,
  queryArgArray: InputValueDefinitionNode[],
  deNull: boolean
): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.HttpQueryInputObjectName(parent.name.value, field.name.value);
  // unwrap all the non-nulls in the argument array if the flag is set
  const fields: InputValueDefinitionNode[] = deNull
    ? queryArgArray.map((arg: InputValueDefinitionNode) => {
        return {
          ...arg,
          type: unwrapNonNull(arg.type),
        };
      })
    : queryArgArray;
  return {
    kind: 'InputObjectTypeDefinition',
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeHttpBodyInputObject(
  parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
  field: FieldDefinitionNode,
  bodyArgArray: InputValueDefinitionNode[],
  deNull: boolean
): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.HttpBodyInputObjectName(parent.name.value, field.name.value);
  // unwrap all the non-nulls in the argument array if the flag is set
  const fields: InputValueDefinitionNode[] = deNull
    ? bodyArgArray.map((arg: InputValueDefinitionNode) => {
        return {
          ...arg,
          type: unwrapNonNull(arg.type),
        };
      })
    : bodyArgArray;
  return {
    kind: 'InputObjectTypeDefinition',
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

import { InputValueDefinitionNode, InputObjectTypeDefinitionNode, Kind } from 'graphql';
import { makeNamedType, makeNonNullType } from 'graphql-transformer-common';

export function getActionInputName(action: string, fieldName: string) {
  return `${capitalizeFirstLetter(fieldName)}${capitalizeFirstLetter(action)}Input`;
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function makeActionInputObject(fieldName: string, fields: InputValueDefinitionNode[]): InputObjectTypeDefinitionNode {
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    name: { kind: 'Name' as 'Name', value: `${fieldName}Input` },
    fields,
    directives: []
  };
}

export const actionInputFunctions = {
  translateText: (actionInputName: string, isFirst: boolean = false): InputObjectTypeDefinitionNode => {
    const fields: InputValueDefinitionNode[] = [
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as 'Name', value: 'sourceLanguage' },
        type: makeNonNullType(makeNamedType('String')),
        directives: [],
      },
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as 'Name', value: 'targetLanguage' },
        type: makeNonNullType(makeNamedType('String')),
        directives: [],
      },
      ...( isFirst ? [
        {
          kind: Kind.INPUT_VALUE_DEFINITION,
          name: { kind: 'Name' as 'Name', value: 'text' },
          type: makeNonNullType(makeNamedType('String')),
          directives: [],
        }
      ] : []),
    ];
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      name: { kind: 'Name', value: actionInputName },
      fields,
      directives: []
    };
  },
  identifyText: (actionInputName: string, isFirst: boolean = false): InputObjectTypeDefinitionNode => {
    const fields: InputValueDefinitionNode[] = [
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as 'Name', value: 'key' },
        type: makeNonNullType(makeNamedType('String')),
        directives: [],
      }
    ];
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      name: { kind: 'Name', value: actionInputName },
      fields,
      directives: []
    };
  },
  identifyLabels: (actionInputName: string, isFirst: boolean = false): InputObjectTypeDefinitionNode => {
    const fields: InputValueDefinitionNode[] = [
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as 'Name', value: 'key' },
        type: makeNonNullType(makeNamedType('String')),
        directives: [],
      },
    ];
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      name: { kind: 'Name', value: actionInputName },
      fields,
      directives: []
    };
  },
  convertTextToSpeech: (actionInputName: string, isFirst: boolean = false): InputObjectTypeDefinitionNode => {
    const fields: InputValueDefinitionNode[] = [
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as 'Name', value: 'voiceID' },
        type: makeNonNullType(makeNamedType('String')),
        directives: []
      },
      ...( isFirst ? [
        {
          kind: Kind.INPUT_VALUE_DEFINITION,
          name: { kind: 'Name' as 'Name', value: 'text' },
          type: makeNonNullType(makeNamedType('String')),
          directives: [],
        }
      ] : []),
    ];
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      name: { kind: 'Name', value: actionInputName },
      fields,
      directives: []
    };
  },
};
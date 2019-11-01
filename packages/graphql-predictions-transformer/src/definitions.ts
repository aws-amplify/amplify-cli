import { InputValueDefinitionNode, InputObjectTypeDefinitionNode, Kind } from 'graphql';
import { makeNamedType, makeNonNullType } from 'graphql-transformer-common';

export function makeActionInputObject(fieldName: string, fields: InputValueDefinitionNode[]): InputObjectTypeDefinitionNode {
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    name: { kind: 'Name' as 'Name', value: `${fieldName}Input` },
    fields,
    directives: []
  };
}

export const actionInputFunctions = {
  translateText: (isFirst: boolean = false): InputObjectTypeDefinitionNode => {
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
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as 'Name', value: 'text' },
        type: isFirst ? makeNonNullType(makeNamedType('String')) : makeNamedType('String'),
        directives: [],
      },
    ];
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'TranslateTextInput',
      },
      fields,
      directives: []
    };
  },
  identifyText: (isFirst: boolean = false): InputObjectTypeDefinitionNode => {
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
      name: { kind: 'Name', value: 'IdentifyTextInput' },
      fields,
      directives: []
    };
  },
  convertTextToSpeech: (isFirst: boolean = false): InputObjectTypeDefinitionNode => {
    const fields: InputValueDefinitionNode[] = [
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as 'Name', value: 'voiceID' },
        type: makeNonNullType(makeNamedType('String')),
        directives: []
      },
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as 'Name', value: 'text' },
        type: isFirst ? makeNonNullType(makeNamedType('String')) : makeNamedType('String'),
        directives: [],
      },
    ];
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      name: { kind: 'Name', value: 'ConvertTextToSpeechInput' },
      fields,
      directives: []
    };
  },
};
import { InputValueDefinitionNode, InputObjectTypeDefinitionNode, Kind } from 'graphql';
import { makeNamedType, makeNonNullType } from 'graphql-transformer-common';

function inputValueDefinition(inputValue: string, namedType: string, isNonNull: boolean = false): InputValueDefinitionNode {
  return {
    kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name' as 'Name', value: inputValue },
        type: isNonNull ? makeNonNullType(makeNamedType(namedType)) : makeNamedType(namedType),
        directives: [],
  };
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getActionInputName(action: string, fieldName: string) {
  return `${capitalizeFirstLetter(fieldName)}${capitalizeFirstLetter(action)}Input`;
}

export function makeActionInputObject(fieldName: string, fields: InputValueDefinitionNode[]): InputObjectTypeDefinitionNode {
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    name: { kind: 'Name' as 'Name', value: `${fieldName}Input` },
    fields,
    directives: []
  };
}

export function getActionInputType(action: string, fieldName: string, isFirst: boolean = false): InputObjectTypeDefinitionNode {
  const actionInputFields: { [action: string]: InputValueDefinitionNode[] } = {
    identifyText: [ inputValueDefinition('key', 'String', true) ],
    identifyLabels: [ inputValueDefinition('key', 'String', true) ],
    translateText: [
      inputValueDefinition('sourceLanguage', 'String', true),
      inputValueDefinition('targetLanguage', 'String', true),
      ...( isFirst ? [ inputValueDefinition('text', 'String', true) ] : []),
    ],
    convertTextToSpeech: [
      inputValueDefinition('voiceID', 'String', true),
      ...( isFirst ? [ inputValueDefinition('text', 'String', true) ] : []),
    ]
  };
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    name: { kind: 'Name', value: getActionInputName(action, fieldName) },
    fields: actionInputFields[action],
    directives: []
  };
}
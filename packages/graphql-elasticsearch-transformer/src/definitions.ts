import {
  ObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InputObjectTypeDefinitionNode,
  FieldDefinitionNode,
  Kind,
  TypeNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
} from 'graphql';
import { graphqlName, makeNamedType, isScalar, makeListType, getBaseType, SearchableResourceIDs } from 'graphql-transformer-common';

const STRING_CONDITIONS = ['ne', 'eq', 'match', 'matchPhrase', 'matchPhrasePrefix', 'multiMatch', 'exists', 'wildcard', 'regexp'];
const ID_CONDITIONS = ['ne', 'eq', 'match', 'matchPhrase', 'matchPhrasePrefix', 'multiMatch', 'exists', 'wildcard', 'regexp'];
const INT_CONDITIONS = ['ne', 'gt', 'lt', 'gte', 'lte', 'eq', 'range'];
const FLOAT_CONDITIONS = ['ne', 'gt', 'lt', 'gte', 'lte', 'eq', 'range'];
const BOOLEAN_CONDITIONS = ['eq', 'ne'];

export function makeSearchableScalarInputObject(type: string): InputObjectTypeDefinitionNode {
  const name = SearchableResourceIDs.SearchableFilterInputTypeName(type);
  let conditions = getScalarConditions(type);
  const fields: InputValueDefinitionNode[] = conditions.map((condition: string) => ({
    kind: Kind.INPUT_VALUE_DEFINITION,
    name: { kind: 'Name' as 'Name', value: condition },
    type: getScalarFilterInputType(condition, type, name),
    // TODO: Service does not support new style descriptions so wait.
    // description: field.description,
    directives: [],
  }));
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
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

export function makeSearchableXFilterInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
  const name = SearchableResourceIDs.SearchableFilterInputTypeName(obj.name.value);
  const fields: InputValueDefinitionNode[] = obj.fields
    .filter((field: FieldDefinitionNode) => isScalar(field.type) === true)
    .map((field: FieldDefinitionNode) => ({
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: field.name,
      type: makeNamedType(SearchableResourceIDs.SearchableFilterInputTypeName(getBaseType(field.type))),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    }));

  fields.push(
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'and',
      },
      type: makeListType(makeNamedType(name)),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'or',
      },
      type: makeListType(makeNamedType(name)),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'not',
      },
      type: makeNamedType(name),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    }
  );
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeSearchableSortDirectionEnumObject(): EnumTypeDefinitionNode {
  const name = graphqlName(`SearchableSortDirection`);
  return {
    kind: Kind.ENUM_TYPE_DEFINITION,
    name: {
      kind: 'Name',
      value: name,
    },
    values: [
      {
        kind: Kind.ENUM_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'asc' },
        directives: [],
      },
      {
        kind: Kind.ENUM_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'desc' },
        directives: [],
      },
    ],
    directives: [],
  };
}

export function makeSearchableXSortableFieldsEnumObject(obj: ObjectTypeDefinitionNode): EnumTypeDefinitionNode {
  const name = graphqlName(`Searchable${obj.name.value}SortableFields`);
  const values: EnumValueDefinitionNode[] = obj.fields
    .filter((field: FieldDefinitionNode) => isScalar(field.type) === true)
    .map((field: FieldDefinitionNode) => ({
      kind: Kind.ENUM_VALUE_DEFINITION,
      name: field.name,
      directives: [],
    }));

  return {
    kind: Kind.ENUM_TYPE_DEFINITION,
    name: {
      kind: 'Name',
      value: name,
    },
    values,
    directives: [],
  };
}

export function makeSearchableXSortInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
  const name = graphqlName(`Searchable${obj.name.value}SortInput`);
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} delete mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields: [
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'field' },
        type: makeNamedType(`Searchable${obj.name.value}SortableFields`),
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `The id of the ${obj.name.value} to delete.`
        // },
        directives: [],
      },
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'direction' },
        type: makeNamedType('SearchableSortDirection'),
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `The id of the ${obj.name.value} to delete.`
        // },
        directives: [],
      },
    ],
    directives: [],
  };
}

function getScalarFilterInputType(condition: string, type: string, filterInputName: string): TypeNode {
  switch (condition) {
    case 'range':
      return makeListType(makeNamedType(type));
    case 'exists':
      return makeNamedType('Boolean');
    default:
      return makeNamedType(type);
  }
}

function getScalarConditions(type: string): string[] {
  switch (type) {
    case 'String':
      return STRING_CONDITIONS;
    case 'ID':
      return ID_CONDITIONS;
    case 'Int':
      return INT_CONDITIONS;
    case 'Float':
      return FLOAT_CONDITIONS;
    case 'Boolean':
      return BOOLEAN_CONDITIONS;
    default:
      throw 'Valid types are String, ID, Int, Float, Boolean';
  }
}

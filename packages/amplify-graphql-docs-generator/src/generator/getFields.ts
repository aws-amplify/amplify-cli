import {
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLUnionType,
  GraphQLList,
} from 'graphql'
import getFragment from './getFragment'
import { GQLConcreteType, GQLTemplateField, GQLTemplateFragment } from './types'
import getType from './utils/getType'

export default function getFields(
  field: GraphQLField<any, any>,
  schema: GraphQLSchema,
  depth: number = 2
): GQLTemplateField {
  const fieldType: GQLConcreteType = getType(field.type)
  const subFields =
    fieldType instanceof GraphQLObjectType || fieldType instanceof GraphQLInterfaceType
      ? fieldType.getFields()
      : []

  let subFragments =
    fieldType instanceof GraphQLInterfaceType || fieldType instanceof GraphQLUnionType
      ? schema.getPossibleTypes(fieldType)
      : []
  if (depth < 1 && !(fieldType instanceof GraphQLScalarType)) {
    return
  }

  const fields: Array<GQLTemplateField> = Object.keys(subFields)
    .map((fieldName) => {
      const subField = subFields[fieldName];
      return getFields(subField, schema, depth - 1);
    })
    .filter((field) => field)
  const fragments: Array<GQLTemplateFragment> = Object.keys(subFragments)
    .map((fragment) => getFragment(subFragments[fragment], schema, depth, fields))
    .filter((field) => field)
  return {
    name: field.name,
    fields,
    fragments,
    hasBody: !!(fields.length || fragments.length),
  }
}

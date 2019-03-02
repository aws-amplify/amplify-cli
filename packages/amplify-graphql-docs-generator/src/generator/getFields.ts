import {
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLUnionType,
  GraphQLList,
  isObjectType,
  isInterfaceType,
  isUnionType
} from 'graphql'
import getFragment from './getFragment'
import { GQLConcreteType, GQLTemplateField, GQLTemplateFragment, GQLDocsGenOptions } from './types'
import getType from './utils/getType'
import isS3Object from './utils/isS3Object';

export default function getFields(
  field: GraphQLField<any, any>,
  schema: GraphQLSchema,
  depth: number = 2,
  options: GQLDocsGenOptions
): GQLTemplateField {
  const fieldType: GQLConcreteType = getType(field.type)
  const renderS3FieldFragment = options.useExternalFragmentForS3Object && isS3Object(fieldType);
  const subFields =
    !renderS3FieldFragment && (isObjectType(fieldType) || isInterfaceType(fieldType))
      ? fieldType.getFields()
      : []

  const subFragments: any =
    isInterfaceType(fieldType) || isUnionType(fieldType)
      ? schema.getPossibleTypes(fieldType)
      : {};

  if (depth < 1 && !(fieldType instanceof GraphQLScalarType)) {
    return
  }

  const fields: Array<GQLTemplateField> = Object.keys(subFields)
    .map((fieldName) => {
      const subField = subFields[fieldName];
      return getFields(subField, schema, depth - 1, options);
    })
    .filter((field) => field)
  const fragments: Array<GQLTemplateFragment> = Object.keys(subFragments)
    .map((fragment) => getFragment(subFragments[fragment], schema, depth, fields, null, false, options))
    .filter((field) => field)

  // Special treatment for S3 input
  // Swift SDK needs S3 Object to have fragment
  if (renderS3FieldFragment) {
    fragments.push(getFragment(fieldType as GraphQLObjectType, schema, depth, [], 'S3Object', true, options));
  }

  return {
    name: field.name,
    fields,
    fragments,
    hasBody: !!(fields.length || fragments.length),
  }
}

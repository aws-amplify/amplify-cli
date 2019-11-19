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
  isUnionType,
  isEnumType,
  isScalarType,
} from 'graphql';
import getFragment from './getFragment';
import { GQLConcreteType, GQLTemplateField, GQLTemplateFragment, GQLDocsGenOptions } from './types';
import getType from './utils/getType';
import isS3Object from './utils/isS3Object';

export default function getFields(
  field: GraphQLField<any, any>,
  schema: GraphQLSchema,
  depth: number = 2,
  addTypename: boolean = false,
  options: GQLDocsGenOptions
): GQLTemplateField {
  const fieldType: GQLConcreteType = getType(field.type);
  const renderS3FieldFragment = options.useExternalFragmentForS3Object && isS3Object(fieldType);
  const subFields = !renderS3FieldFragment && (isObjectType(fieldType) || isInterfaceType(fieldType)) ? fieldType.getFields() : [];

  const subFragments: any = isInterfaceType(fieldType) || isUnionType(fieldType) ? schema.getPossibleTypes(fieldType) : {};

  if (depth < 1 && !(isScalarType(fieldType) || isEnumType(fieldType))) {
    return;
  }

  const fields: Array<GQLTemplateField> = Object.keys(subFields)
    .map(fieldName => {
      const subField = subFields[fieldName];
      return getFields(subField, schema, depth - 1, addTypename, options);
    })
    .filter(f => f);
  const fragments: Array<GQLTemplateFragment> = Object.keys(subFragments)
    .map(fragment => getFragment(subFragments[fragment], schema, depth, addTypename, fields, null, false, options))
    .filter(f => f);

  // Special treatment for S3 input
  // Swift SDK needs S3 Object to have fragment
  if (renderS3FieldFragment) {
    fragments.push(getFragment(fieldType as GraphQLObjectType, schema, depth, addTypename, [], 'S3Object', true, options));
  }

  // if the current field is an object and none of the subfields are included, don't include the field itself
  // also if there are fields or fragments and the `addTypename` option is true include the '__typename' field
  if (!(isScalarType(fieldType) || isEnumType(fieldType)) && !renderS3FieldFragment) {
    if (fields.length === 0 && fragments.length === 0) return;
    if (addTypename) fields.unshift({ name: '__typename', fields: [], fragments: [], hasBody: false });
  }

  return {
    name: field.name,
    fields,
    fragments,
    hasBody: !!(fields.length || fragments.length),
  };
}

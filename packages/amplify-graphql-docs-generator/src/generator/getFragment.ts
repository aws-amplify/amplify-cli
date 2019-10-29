import { GraphQLObjectType, GraphQLSchema } from 'graphql';

import getFields from './getFields';
import { GQLTemplateField, GQLTemplateFragment, GQLDocsGenOptions } from './types';

export default function getFragment(
  typeObj: GraphQLObjectType,
  schema: GraphQLSchema,
  depth: number,
  filterFields: Array<GQLTemplateField> = [],
  name?: string,
  external: boolean = false,
  options?: GQLDocsGenOptions
): GQLTemplateFragment {
  const subFields = (typeObj && typeObj.getFields && typeObj.getFields()) || [];
  const filterFieldNames = filterFields.map(f => f.name);
  const fields: Array<GQLTemplateField> = Object.keys(subFields)
    .map(field => getFields(subFields[field], schema, depth - 1, options))
    .filter(field => field && !filterFieldNames.includes(field.name));
  if (fields.length) {
    return {
      on: typeObj.name,
      fields,
      external,
      name: name || `${typeObj.name}Fragment`,
    };
  }
}

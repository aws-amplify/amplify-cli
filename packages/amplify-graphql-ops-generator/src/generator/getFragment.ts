import { GraphQLObjectType, GraphQLSchema } from "graphql";

import getFields from "./getFields";
import { GQLTemplateField, GQLTemplateFragment } from "./types";

export function getFragment(
  typeObj: GraphQLObjectType,
  schema: GraphQLSchema,
  depth: number,
  filterFields: Array<GQLTemplateField> = []
): GQLTemplateFragment {
  const subFields = typeObj.getFields();
  const filterFieldNames = filterFields.map(f => f.name);
  const fields: Array<GQLTemplateField> = Object.keys(subFields)
    .map(field => getFields(subFields[field], schema, depth - 1))
    .filter(field => field && !filterFieldNames.includes(field.name));
  if (fields.length) {
    return {
      on: typeObj.name,
      fields
    };
  }
}

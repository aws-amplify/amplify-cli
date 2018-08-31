import {
  buildClientSchema,
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLType,
  GraphQLUnionType,
  IntrospectionQuery
} from "graphql";
const pascalCase = require("pascal-case");

export type GQLConcreteType =
  | GraphQLScalarType
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType
  | GraphQLEnumType
  | GraphQLInputObjectType;

export type GQLTemplateFragment = {
  on: string;
  fields: Array<GQLTemplateField>;
};
export enum GQLOperationTypeEnum {
  QUERY = "query",
  MUTATION = "mutation",
  SUBSCRIPTION = "subscription"
}

export type GQLTemplateField = {
  name: string;
  fields: Array<GQLTemplateField>;
  fragments: Array<GQLTemplateFragment>;
  hasBody: boolean;
};

export type GQLTemplateArgDeclaration = {
  name: string;
  type: string;
  isRequired: boolean;
  defaultValue: string | null;
};

export type GQLTemplateArgInvocation = {
  name: string;
  value: string;
};

export type GQLTemplateOpBody = GQLTemplateField & {
  args: Array<GQLTemplateArgInvocation>;
};
export type GQLTemplateGenericOp = {
  args: Array<GQLTemplateArgDeclaration>;
  body: GQLTemplateOpBody;
};
export type GQLTemplateOp = GQLTemplateGenericOp & {
  type: GQLOperationTypeEnum;
  name: string;
};

export default function generate(schemaDocument: IntrospectionQuery): {
  queries: Array<GQLTemplateOp>,
  mutations: Array<GQLTemplateOp>,
  subscriptions: Array<GQLTemplateOp>
} {
  try {
    const schemaDoc: GraphQLSchema = buildClientSchema(schemaDocument);
    const queryTypes: GraphQLObjectType = schemaDoc.getQueryType();
    const mutationType: GraphQLObjectType = schemaDoc.getMutationType();
    const subscriptionType: GraphQLObjectType = schemaDoc.getSubscriptionType();

    const queries = generateQueries(queryTypes, schemaDoc) || [];
    const mutations = generateMutations(mutationType, schemaDoc) || [];
    const subscriptions = generateSubscriptions(subscriptionType, schemaDoc) || [];
    return { queries, mutations, subscriptions};
  } catch (e) {
    throw new Error(
      "GraphQL schema file should contain a valid GraphQL introspection query result"
    );
  }
}

function generateOperation(
  operation: GraphQLField<any, any>,
  schema: GraphQLSchema
): GQLTemplateGenericOp {
  const args: Array<GQLTemplateArgDeclaration> = getArgs(operation.args);
  const body: GQLTemplateOpBody = getBody(operation, schema);
  return {
    args,
    body
  };
}

function generateQueries(
  queries: GraphQLObjectType,
  schema: GraphQLSchema
): Array<GQLTemplateOp> | undefined {
  if (queries) {
    const allQueries = queries.getFields();
    const processedQueries: Array<GQLTemplateOp> = Object.keys(allQueries).map(queryName => {
      const type: GQLOperationTypeEnum = GQLOperationTypeEnum.QUERY;
      const op = generateOperation(allQueries[queryName], schema);
      const name: string = pascalCase(queryName);
      return { type, name, ...op };
    });

    return processedQueries;
  }
}

function generateMutations(mutations: GraphQLObjectType, schema: GraphQLSchema): Array<any> {
  if (mutations) {
    const allMutations = mutations.getFields();
    const processedMutations = Object.keys(allMutations).map(mutationName => {
      const type = "mutation";
      const op = generateOperation(allMutations[mutationName], schema);
      const name = pascalCase(mutationName);
      return { type, name, ...op };
    });
    return processedMutations;
  }
}

function generateSubscriptions(
  subscriptions: GraphQLObjectType,
  schema: GraphQLSchema
): Array<any> {
  if (subscriptions) {
    const allSubscriptions = subscriptions.getFields();
    const processedMutations = Object.keys(allSubscriptions).map(subscriptionName => {
      const type = "subscription";
      const op = generateOperation(allSubscriptions[subscriptionName], schema);
      const name = pascalCase(subscriptionName);
      return { type, name, ...op };
    });
    return processedMutations;
  }
}

function getBody(op: GraphQLField<any, any>, schema: GraphQLSchema): GQLTemplateOpBody {
  const args: Array<GQLTemplateArgInvocation> = op.args.map(arg => ({
    name: arg.name,
    value: `\$${arg.name}`
  }));

  const fields: GQLTemplateField = getFields(op, schema);
  return {
    args,
    ...fields
  };
}

function getArgs(args: GraphQLArgument[]): Array<GQLTemplateArgDeclaration> {
  const argMaps = args.map((arg: GraphQLArgument) => ({
    name: arg.name,
    type: getType(arg.type).name,
    isRequired: isRequired(arg),
    defaultValue: arg.defaultValue
  }));
  return argMaps;
}

function getType(typeObj: GraphQLType): GQLConcreteType {
  if (typeObj instanceof GraphQLList || typeObj instanceof GraphQLNonNull) {
    return getType(typeObj.ofType);
  }
  return typeObj;
}

function isRequired(arg: GraphQLArgument): boolean {
  return arg.type instanceof GraphQLNonNull ? true : false;
}

type Fragment = {
  name: string;
  fields: [Field];
};
type Field = {
  name: string;
  fields: [Field];
  fragments: [Fragment] | null;
};

function getFields(
  field: GraphQLField<any, any>,
  schema: GraphQLSchema,
  depth: number = 3
): GQLTemplateField {
  const fieldType: GQLConcreteType = getType(field.type);

  const subFields =
    fieldType instanceof GraphQLObjectType || fieldType instanceof GraphQLInterfaceType
      ? fieldType.getFields()
      : [];
  let subFragments =
    fieldType instanceof GraphQLInterfaceType || fieldType instanceof GraphQLUnionType
      ? schema.getPossibleTypes(fieldType)
      : [];

  if (depth <= 1 && !(fieldType instanceof GraphQLScalarType)) {
    return;
  }
  const fields: Array<GQLTemplateField> = Object.keys(subFields)
    .map(fieldName => getFields(subFields[fieldName], schema, depth - 1))
    .filter(field => field);
  const fragments: Array<GQLTemplateFragment> = Object.keys(subFragments)
    .map(fragment => getFragment(subFragments[fragment], schema, depth, fields))
    .filter(field => field);

  return {
    name: field.name,
    fields,
    fragments,
    hasBody: !!(fields.length || fragments.length)
  };
}

function getFragment(
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

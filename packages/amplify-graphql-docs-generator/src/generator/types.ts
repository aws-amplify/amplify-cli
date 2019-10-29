import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLUnionType,
} from 'graphql';

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
  external: boolean;
  name: string;
};

export enum GQLOperationTypeEnum {
  QUERY = 'query',
  MUTATION = 'mutation',
  SUBSCRIPTION = 'subscription',
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
  isList: boolean;
  isListRequired: boolean;
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

export type GQLAllOperations = {
  queries: Array<GQLTemplateOp>;
  mutations: Array<GQLTemplateOp>;
  subscriptions: Array<GQLTemplateOp>;
  fragments: Array<GQLTemplateFragment>;
};

export type GQLDocsGenOptions = {
  useExternalFragmentForS3Object: boolean;
};

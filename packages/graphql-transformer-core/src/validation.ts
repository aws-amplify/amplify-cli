import { Kind, DocumentNode, parse, SchemaDefinitionNode } from 'graphql/language';
import { validate, ValidationRule } from 'graphql/validation';
import { buildASTSchema } from 'graphql/utilities/buildASTSchema';

// Spec Section: "Subscriptions with Single Root Field"
import { SingleFieldSubscriptions } from 'graphql/validation/rules/SingleFieldSubscriptions';

// Spec Section: "Fragment Spread Type Existence"
import { KnownTypeNames } from 'graphql/validation/rules/KnownTypeNames';

// Spec Section: "Fragments on Composite Types"
import { FragmentsOnCompositeTypes } from 'graphql/validation/rules/FragmentsOnCompositeTypes';

// Spec Section: "Variables are Input Types"
import { VariablesAreInputTypes } from 'graphql/validation/rules/VariablesAreInputTypes';

// Spec Section: "Leaf Field Selections"
import { ScalarLeafs } from 'graphql/validation/rules/ScalarLeafs';

// Spec Section: "Field Selections on Objects, Interfaces, and Unions Types"
import { FieldsOnCorrectType } from 'graphql/validation/rules/FieldsOnCorrectType';

// Spec Section: "Directives Are Defined"
import { KnownDirectives } from 'graphql/validation/rules/KnownDirectives';

// Spec Section: "Argument Names"
import { KnownArgumentNames } from 'graphql/validation/rules/KnownArgumentNames';

// Spec Section: "Argument Uniqueness"
import { UniqueArgumentNames } from 'graphql/validation/rules/UniqueArgumentNames';

// Spec Section: "Value Type Correctness"
import { ValuesOfCorrectType } from 'graphql/validation/rules/ValuesOfCorrectType';

// Spec Section: "All Variable Usages Are Allowed"
import { VariablesInAllowedPosition } from 'graphql/validation/rules/VariablesInAllowedPosition';

// Spec Section: "Field Selection Merging"
import { OverlappingFieldsCanBeMerged } from 'graphql/validation/rules/OverlappingFieldsCanBeMerged';

// Spec Section: "Input Object Field Uniqueness"
import { UniqueInputFieldNames } from 'graphql/validation/rules/UniqueInputFieldNames';

import { ProvidedRequiredArguments } from 'graphql/validation/rules/ProvidedRequiredArguments';
import { UniqueOperationNames } from 'graphql/validation/rules/UniqueOperationNames';
import { LoneAnonymousOperation } from 'graphql/validation/rules/LoneAnonymousOperation';
import { UniqueFragmentNames } from 'graphql/validation/rules/UniqueFragmentNames';
import { KnownFragmentNames } from 'graphql/validation/rules/KnownFragmentNames';
import { NoUnusedFragments } from 'graphql/validation/rules/NoUnusedFragments';
import { PossibleFragmentSpreads } from 'graphql/validation/rules/PossibleFragmentSpreads';
import { NoFragmentCycles } from 'graphql/validation/rules/NoFragmentCycles';
import { UniqueVariableNames } from 'graphql/validation/rules/UniqueVariableNames';
import { NoUndefinedVariables } from 'graphql/validation/rules/NoUndefinedVariables';
import { NoUnusedVariables } from 'graphql/validation/rules/NoUnusedVariables';
import { UniqueDirectivesPerLocation } from 'graphql/validation/rules/UniqueDirectivesPerLocation';

/**
 * This set includes all validation rules defined by the GraphQL spec.
 *
 * The order of the rules in this list has been adjusted to lead to the
 * most clear output when encountering multiple validation errors.
 */
export const specifiedRules: Readonly<ValidationRule[]> = [
  UniqueOperationNames,
  LoneAnonymousOperation,
  SingleFieldSubscriptions,
  KnownTypeNames,
  FragmentsOnCompositeTypes,
  VariablesAreInputTypes,
  ScalarLeafs,
  FieldsOnCorrectType,
  UniqueFragmentNames,
  KnownFragmentNames,
  NoUnusedFragments,
  PossibleFragmentSpreads,
  NoFragmentCycles,
  UniqueVariableNames,
  NoUndefinedVariables,
  NoUnusedVariables,
  KnownDirectives,
  UniqueDirectivesPerLocation,
  KnownArgumentNames,
  UniqueArgumentNames,
  ValuesOfCorrectType,
  ProvidedRequiredArguments,
  VariablesInAllowedPosition,
  OverlappingFieldsCanBeMerged,
  UniqueInputFieldNames,
];

const EXTRA_SCALARS_DOCUMENT = parse(`
scalar AWSDate
scalar AWSTime
scalar AWSDateTime
scalar AWSTimestamp
scalar AWSEmail
scalar AWSJSON
scalar AWSURL
scalar AWSPhone
scalar AWSIPAddress
scalar BigInt
scalar Double
`);

export const EXTRA_DIRECTIVES_DOCUMENT = parse(`
directive @aws_subscribe(mutations: [String!]!) on FIELD_DEFINITION
directive @aws_auth(cognito_groups: [String!]!) on FIELD_DEFINITION
directive @aws_api_key on FIELD_DEFINITION | OBJECT
directive @aws_iam on FIELD_DEFINITION | OBJECT
directive @aws_oidc on FIELD_DEFINITION | OBJECT
directive @aws_cognito_user_pools(cognito_groups: [String!]) on FIELD_DEFINITION | OBJECT

# Allows transformer libraries to deprecate directive arguments.
directive @deprecated(reason: String) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION | ENUM | ENUM_VALUE
`);

// As query type is mandatory in the schema we've to append a dummy one if it is not present
const NOOP_QUERY = parse(`
type Query {
  noop: String
}
`);

export const validateModelSchema = (doc: DocumentNode) => {
  const fullDocument = {
    kind: Kind.DOCUMENT,
    definitions: [...EXTRA_DIRECTIVES_DOCUMENT.definitions, ...doc.definitions, ...EXTRA_SCALARS_DOCUMENT.definitions],
  };

  const schemaDef = doc.definitions.find(d => d.kind === Kind.SCHEMA_DEFINITION) as SchemaDefinitionNode;
  const queryOperation = schemaDef ? schemaDef.operationTypes.find(o => o.operation === 'query') : undefined;
  const queryName = queryOperation ? queryOperation.type.name.value : 'Query';
  const existingQueryType = doc.definitions.find(
    d => d.kind !== Kind.DIRECTIVE_DEFINITION && d.kind !== Kind.SCHEMA_DEFINITION && (d as any).name && (d as any).name.value === queryName
  );

  if (!existingQueryType) {
    fullDocument.definitions.push(...NOOP_QUERY.definitions);
  }

  const schema = buildASTSchema(fullDocument);
  return validate(schema, fullDocument, specifiedRules);
};

import { GraphQLScalarType } from 'graphql'
import {
    Kind, DocumentNode, TypeSystemDefinitionNode,
    DirectiveDefinitionNode, ScalarTypeDefinitionNode, parse,
    SchemaDefinitionNode, TypeDefinitionNode
} from 'graphql/language'
import { GraphQLSchema, GraphQLObjectType, isOutputType } from 'graphql/type'
import { validate } from 'graphql/validation'
import { ASTDefinitionBuilder } from 'graphql/utilities/buildASTSchema'

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

import { ProvidedNonNullArguments } from 'graphql/validation/rules/ProvidedNonNullArguments';

/**
 * This set includes all validation rules defined by the GraphQL spec.
 *
 * The order of the rules in this list has been adjusted to lead to the
 * most clear output when encountering multiple validation errors.
 */
export const specifiedRules = [
    SingleFieldSubscriptions,
    KnownTypeNames,
    FragmentsOnCompositeTypes,
    VariablesAreInputTypes,
    ScalarLeafs,
    FieldsOnCorrectType,
    KnownDirectives,
    KnownArgumentNames,
    UniqueArgumentNames,
    ValuesOfCorrectType,
    VariablesInAllowedPosition,
    OverlappingFieldsCanBeMerged,
    UniqueInputFieldNames,
    ProvidedNonNullArguments
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
`)

const EXTRA_DIRECTIVES_DOCUMENT = parse(`
directive @aws_subscribe(mutations: [String!]!) on FIELD_DEFINITION
directive @aws_auth(cognito_groups: [String!]!) on FIELD_DEFINITION

# Allows transformer libraries to deprecate directive arguments.
directive @deprecated(reason: String!) on INPUT_FIELD_DEFINITION | ENUM
`)

export function astBuilder(doc: DocumentNode): ASTDefinitionBuilder {
    const nodeMap = doc.definitions
        .filter((def: TypeSystemDefinitionNode) => def.kind !== Kind.SCHEMA_DEFINITION && Boolean(def.name))
        .reduce(
            (a: { [k: string]: TypeDefinitionNode }, def: TypeDefinitionNode) => ({
                ...a,
                [def.name.value]: def
            }), {})
    return new ASTDefinitionBuilder(
        nodeMap,
        {},
        typeRef => {
            throw new Error(`Type "${typeRef.name.value}" not found in document.`);
        },
    )
}

export function validateModelSchema(doc: DocumentNode) {
    const fullDocument = {
        kind: Kind.DOCUMENT,
        definitions: [
            ...EXTRA_DIRECTIVES_DOCUMENT.definitions,
            ...doc.definitions,
            ...EXTRA_SCALARS_DOCUMENT.definitions,
        ]
    }
    const builder = astBuilder(fullDocument)
    const directives = fullDocument.definitions
        .filter(d => d.kind === Kind.DIRECTIVE_DEFINITION)
        .map((d: DirectiveDefinitionNode) => {
            return builder.buildDirective(d)
        })
    const types = fullDocument.definitions
        .filter(d => d.kind !== Kind.DIRECTIVE_DEFINITION && d.kind !== Kind.SCHEMA_DEFINITION)
        .map((d: TypeDefinitionNode) => builder.buildType(d))
    const outputTypes = types.filter(
        t => isOutputType(t)
    )
    const fields = outputTypes.reduce(
        (acc, t) => ({ ...acc, [t.name]: { type: t } }),
        {}
    )

    const schemaRecord = doc.definitions.find(d => d.kind === Kind.SCHEMA_DEFINITION) as SchemaDefinitionNode;
    const queryOp = schemaRecord ? schemaRecord.operationTypes.find(o => o.operation === 'query') : undefined;
    const queryName = queryOp ? queryOp.type.name.value : 'Query';
    const existingQueryType = types.find(t => t.name === queryName) as GraphQLObjectType;
    const queryType = existingQueryType ?
        existingQueryType :
        new GraphQLObjectType({
            name: queryName,
            fields
        })
    const schema = new GraphQLSchema({ query: queryType, types, directives });
    return validate(schema, fullDocument, specifiedRules)
}
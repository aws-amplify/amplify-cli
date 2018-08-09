import { TypeInfo } from 'graphql/utilities'
import {
    Kind, DocumentNode, TypeDefinitionNode, DirectiveDefinitionNode
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

// Spec Section: "Directives Are Unique Per Location"
import { UniqueDirectivesPerLocation } from 'graphql/validation/rules/UniqueDirectivesPerLocation';

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
    UniqueDirectivesPerLocation,
    KnownArgumentNames,
    UniqueArgumentNames,
    ValuesOfCorrectType,
    VariablesInAllowedPosition,
    OverlappingFieldsCanBeMerged,
    UniqueInputFieldNames,
];

export function astBuilder(doc: DocumentNode): ASTDefinitionBuilder {
    const nodeMap = doc.definitions.reduce(
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
    const builder = astBuilder(doc)
    const directives = doc.definitions
        .filter(d => d.kind === Kind.DIRECTIVE_DEFINITION)
        .map((d: DirectiveDefinitionNode) => builder.buildDirective(d))
    const types = doc.definitions
        .filter(d => d.kind !== Kind.DIRECTIVE_DEFINITION)
        .map((d: TypeDefinitionNode) => builder.buildType(d))
    const outputTypes = types.filter(
        t => isOutputType(t)
    )
    console.log(`TYPES: [${types.map(t => t.name).join(', ')}]`)
    const fields = outputTypes.reduce(
        (acc, t) => ({ ...acc, [t.name]: { type: t } }),
        {}
    )
    const queryType = new GraphQLObjectType({
        name: 'Query',
        fields
    })
    const schema = new GraphQLSchema({ query: queryType, types, directives });
    return validate(schema, doc, specifiedRules)
}
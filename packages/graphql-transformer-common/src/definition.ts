import {
    ObjectTypeDefinitionNode, InputValueDefinitionNode, FieldDefinitionNode,
    TypeNode, SchemaDefinitionNode, OperationTypeNode, OperationTypeDefinitionNode,
    ObjectTypeExtensionNode, NamedTypeNode, Kind, NonNullTypeNode, ListTypeNode,
    valueFromASTUntyped, ArgumentNode, DirectiveNode, EnumTypeDefinitionNode
} from 'graphql'

export const STANDARD_SCALARS = {
    String: 'String',
    Int: 'Int',
    Float: 'Int',
    Boolean: 'Boolean',
    ID: 'ID'
};

const OTHER_SCALARS = {
    BigInt: 'Int',
    Double: 'Float'
};

export const APPSYNC_DEFINED_SCALARS: { [k: string]: string } = {
    AWSDate: 'String',
    AWSTime: 'String',
    AWSDateTime: 'String',
    AWSTimestamp: 'Int',
    AWSEmail: 'String',
    AWSJSON: 'String',
    AWSURL: 'String',
    AWSPhone: 'String',
    AWSIPAddress: 'String'
};

export const DEFAULT_SCALARS: { [k: string]: string } = {
    ...STANDARD_SCALARS,
    ...OTHER_SCALARS,
    ...APPSYNC_DEFINED_SCALARS
};

export const NUMERIC_SCALARS: { [k: string]: boolean } = {
    BigInt: true,
    Int: true,
    Float: true,
    Double: true,
    AWSTimestamp: true
};

export const MAP_SCALARS: { [k: string]: boolean } = {
    AWSJSON: true
};

export function isScalar(type: TypeNode) {
    if (type.kind === Kind.NON_NULL_TYPE) {
        return isScalar(type.type)
    } else if (type.kind === Kind.LIST_TYPE) {
        return isScalar(type.type)
    } else {
        return Boolean(DEFAULT_SCALARS[type.name.value])
    }
}

export function isScalarOrEnum(enums: EnumTypeDefinitionNode[]) {
    return (type: TypeNode) => {
        if (type.kind === Kind.NON_NULL_TYPE) {
            return isScalar(type.type)
        } else if (type.kind === Kind.LIST_TYPE) {
            return isScalar(type.type)
        } else {
            for (const e of enums) {
                if (e.name.value === type.name.value) {
                    return true
                }
            }
            return Boolean(DEFAULT_SCALARS[type.name.value])
        }
    }
}

export function getBaseType(type: TypeNode): string {
    if (type.kind === Kind.NON_NULL_TYPE) {
        return getBaseType(type.type)
    } else if (type.kind === Kind.LIST_TYPE) {
        return getBaseType(type.type)
    } else {
        return type.name.value;
    }
}

export function isListType(type: TypeNode): boolean {
    if (type.kind === Kind.NON_NULL_TYPE) {
        return isListType(type.type)
    } else if (type.kind === Kind.LIST_TYPE) {
        return true
    } else {
        return false;
    }
}

export const getDirectiveArgument = (directive: DirectiveNode) => (arg: string, dflt?: any) => {
    const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s
    const argument = directive.arguments.find(get(arg))
    return argument ? valueFromASTUntyped(argument.value) : dflt
}

export function unwrapNonNull(type: TypeNode) {
    if (type.kind === 'NonNullType') {
        return unwrapNonNull(type.type)
    }
    return type
}

export function wrapNonNull(type: TypeNode) {
    if (type.kind !== 'NonNullType') {
        return makeNonNullType(type)
    }
    return type
}

export function makeOperationType(
    operation: OperationTypeNode,
    type: string
): OperationTypeDefinitionNode {
    return {
        kind: 'OperationTypeDefinition',
        operation,
        type: {
            kind: 'NamedType',
            name: {
                kind: 'Name',
                value: type
            }
        }
    }
}

export function makeSchema(operationTypes: OperationTypeDefinitionNode[]): SchemaDefinitionNode {
    return {
        kind: Kind.SCHEMA_DEFINITION,
        operationTypes,
        directives: []
    }
}

export function blankObject(name: string): ObjectTypeDefinitionNode {
    return {
        kind: 'ObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        fields: [],
        directives: [],
        interfaces: []
    }
}

export function blankObjectExtension(name: string): ObjectTypeExtensionNode {
    return {
        kind: Kind.OBJECT_TYPE_EXTENSION,
        name: {
            kind: 'Name',
            value: name
        },
        fields: [],
        directives: [],
        interfaces: []
    }
}

export function extensionWithFields(object: ObjectTypeExtensionNode, fields: FieldDefinitionNode[]): ObjectTypeExtensionNode {
    return {
        ...object,
        fields: [...object.fields, ...fields]
    }
}

export function makeField(name: string, args: InputValueDefinitionNode[], type: TypeNode): FieldDefinitionNode {
    return {
        kind: Kind.FIELD_DEFINITION,
        name: {
            kind: 'Name',
            value: name
        },
        arguments: args,
        type,
        directives: []
    }
}

export function makeArg(name: string, type: TypeNode): InputValueDefinitionNode {
    return {
        kind: 'InputValueDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        type,
        directives: []
    }
}

export function makeNamedType(name: string): NamedTypeNode {
    return {
        kind: 'NamedType',
        name: {
            kind: 'Name',
            value: name
        }
    }
}

export function makeNonNullType(type: NamedTypeNode | ListTypeNode): NonNullTypeNode {
    return {
        kind: Kind.NON_NULL_TYPE,
        type
    }
}

export function makeListType(type: TypeNode): TypeNode {
    return {
        kind: 'ListType',
        type
    }
}

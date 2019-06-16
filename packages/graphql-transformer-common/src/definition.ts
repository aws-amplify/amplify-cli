import {
    ObjectTypeDefinitionNode, InputValueDefinitionNode, FieldDefinitionNode,
    TypeNode, SchemaDefinitionNode, OperationTypeNode, OperationTypeDefinitionNode,
    ObjectTypeExtensionNode, NamedTypeNode, Kind, NonNullTypeNode, ListTypeNode,
    valueFromASTUntyped, ArgumentNode, DirectiveNode, EnumTypeDefinitionNode,
    ValueNode,
    ListValueNode,
    ObjectValueNode,
    InputObjectTypeDefinitionNode
} from 'graphql'
import { access } from 'fs';

type ScalarMap = {
    [k: string]: 'String' | 'Int' | 'Float' | 'Boolean' | 'ID'
}
export const STANDARD_SCALARS: ScalarMap = {
    String: 'String',
    Int: 'Int',
    Float: 'Float',
    Boolean: 'Boolean',
    ID: 'ID'
};

const OTHER_SCALARS: ScalarMap = {
    BigInt: 'Int',
    Double: 'Float'
};

export const APPSYNC_DEFINED_SCALARS: ScalarMap = {
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

export const DEFAULT_SCALARS: ScalarMap = {
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

export function attributeTypeFromScalar(scalar: TypeNode) {
    const baseType = getBaseType(scalar);
    const baseScalar = DEFAULT_SCALARS[baseType];
    if (!baseScalar) {
        throw new Error(`Expected scalar and got ${baseType}`);
    }
    switch (baseScalar) {
        case 'String':
        case 'ID':
            return 'S';
        case 'Int':
        case 'Float':
            return 'N';
        case 'Boolean':
            throw new Error(`Boolean values cannot be used as sort keys.`)
        default:
            throw new Error(`There is no valid DynamoDB attribute type for scalar ${baseType}`)
    }
}

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

export function isNonNullType(type: TypeNode): boolean {
    return type.kind === Kind.NON_NULL_TYPE;
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

export function makeInputObjectDefinition(name: string, inputs: InputValueDefinitionNode[]): InputObjectTypeDefinitionNode {
    return {
        kind: 'InputObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        fields: inputs,
        directives: []
    }
}

export function makeField(name: string, args: InputValueDefinitionNode[], type: TypeNode, directives: DirectiveNode[] = []): FieldDefinitionNode {
    return {
        kind: Kind.FIELD_DEFINITION,
        name: {
            kind: 'Name',
            value: name
        },
        arguments: args,
        type,
        directives
    }
}

export function makeDirective(name: string, args: ArgumentNode[]): DirectiveNode {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: name
        },
        arguments: args
    }
}

export function makeArgument(name: string, value: ValueNode): ArgumentNode {
    return {
        kind: Kind.ARGUMENT,
        name: {
            kind: 'Name',
            value: name
        },
        value
    }
}

export function makeValueNode(value: any): ValueNode {
    if (typeof value === 'string') {
        return { kind: Kind.STRING, value: value }
    } else if (Number.isInteger(value)) {
        return { kind: Kind.INT, value: value }
    } else if (typeof value === 'number') {
        return { kind: Kind.FLOAT, value: String(value) }
    } else if (typeof value === 'boolean') {
        return { kind: Kind.BOOLEAN, value: value }
    } else if (value === null) {
        return { kind: Kind.NULL }
    } else if (Array.isArray(value)) {
        return {
            kind: Kind.LIST,
            values: value.map(v => makeValueNode(v))
        }
    } else if (typeof value === 'object') {
        return {
            kind: Kind.OBJECT,
            fields: Object.keys(value).map((key: string) => {
                const keyValNode = makeValueNode(value[key])
                return {
                    kind: Kind.OBJECT_FIELD,
                    name: { kind: Kind.NAME, value: key },
                    value: keyValNode
                }
            })
        }
    }
}

export function makeInputValueDefinition(name: string, type: TypeNode): InputValueDefinitionNode {
    return {
        kind: Kind.INPUT_VALUE_DEFINITION,
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

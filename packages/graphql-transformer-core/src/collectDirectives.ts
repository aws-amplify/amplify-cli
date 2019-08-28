import {
    ObjectTypeDefinitionNode, DirectiveNode, InterfaceTypeDefinitionNode,
    UnionTypeDefinitionNode, ScalarTypeDefinitionNode, InputObjectTypeDefinitionNode,
    FieldDefinitionNode, InputValueDefinitionNode, EnumValueDefinitionNode, EnumTypeDefinitionNode,
    parse,
    Kind
} from "graphql";

export function collectDirectiveNames(sdl: string): string[] {
    const dirs = collectDirectives(sdl)
    return dirs.map(d => d.name.value)
}

export function collectDirectives(sdl: string): DirectiveNode[] {
    const doc = parse(sdl)
    let directives = []
    for (const def of doc.definitions) {
        switch (def.kind) {
            case Kind.OBJECT_TYPE_DEFINITION:
                // Does def node have a @model and no @auth.
                directives = directives.concat(collectObjectDirectives(def))
                break;
            case Kind.INTERFACE_TYPE_DEFINITION:
                directives = directives.concat(collectInterfaceDirectives(def))
                break;
            case Kind.UNION_TYPE_DEFINITION:
                directives = directives.concat(collectUnionDirectives(def))
                break;
            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                directives = directives.concat(collectInputObjectDirectives(def))
                break;
            case Kind.ENUM_TYPE_DEFINITION:
                directives = directives.concat(collectEnumDirectives(def))
                break;
            case Kind.SCALAR_TYPE_DEFINITION:
                directives = directives.concat(collectScalarDirectives(def))
                break;
        }
    }
    return directives
}

export function collectDirectivesByTypeNames(sdl: string): Object {
    let types = collectDirectivesByType(sdl);
    const directives: Set<string> = new Set();
    Object.keys(types).forEach( (dir) => {
        let set: Set<string> = new Set();
        types[dir].forEach( (d: DirectiveNode) => {
            set.add(d.name.value);
            directives.add(d.name.value);
        })
        types[dir] = Array.from(set);
    })
    return { types, directives: Array.from(directives) };
}
export function collectDirectivesByType(sdl: string): Object {
    const doc = parse(sdl)
    // defined types with directives list
    let types = {};
    for (const def of doc.definitions) {
        switch (def.kind) {
            case Kind.OBJECT_TYPE_DEFINITION:
                types[def.name.value] = [ ...types[def.name.value] || [],
                    ...collectObjectDirectives(def)]
                break;
            case Kind.INTERFACE_TYPE_DEFINITION:
                types[def.name.value] = [...types[def.name.value] || [],
                    ...collectInterfaceDirectives(def)]
                break;
            case Kind.UNION_TYPE_DEFINITION:
                types[def.name.value] = [...types[def.name.value] || [],
                    ...collectUnionDirectives(def)]
                break;
            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                types[def.name.value] = [...types[def.name.value] || [],
                    ...collectInputObjectDirectives(def)]
                break;
            case Kind.ENUM_TYPE_DEFINITION:
                types[def.name.value] = [...types[def.name.value] || [],
                    ...collectEnumDirectives(def)]
                break;
            case Kind.SCALAR_TYPE_DEFINITION:
                types[def.name.value] = [...types[def.name.value] || [],
                    ...collectScalarDirectives(def)]
                break;
        }
    }
    return types;
}

export function collectObjectDirectives(node: ObjectTypeDefinitionNode): DirectiveNode[] {
    let dirs = []
    for (const field of node.fields) {
        const fieldDirs = collectFieldDirectives(field)
        dirs = dirs.concat(fieldDirs)
    }
    return dirs.concat(node.directives)
}

export function collectInterfaceDirectives(node: InterfaceTypeDefinitionNode): DirectiveNode[] {
    let dirs = []
    for (const field of node.fields) {
        const fieldDirs = collectFieldDirectives(field)
        dirs = dirs.concat(fieldDirs)
    }
    return dirs.concat(node.directives)
}

export function collectFieldDirectives(node: FieldDefinitionNode): DirectiveNode[] {
    let dirs = []
    for (const arg of node.arguments) {
        const argDirs = collectArgumentDirectives(arg)
        dirs = dirs.concat(argDirs)
    }
    return dirs.concat(node.directives)
}

export function collectArgumentDirectives(node: InputValueDefinitionNode): DirectiveNode[] {
    return [...(node.directives || [])]
}

export function collectUnionDirectives(node: UnionTypeDefinitionNode): DirectiveNode[] {
    return [...(node.directives || [])]
}

export function collectScalarDirectives(node: ScalarTypeDefinitionNode): DirectiveNode[] {
    return [...(node.directives || [])]
}

export function collectInputObjectDirectives(node: InputObjectTypeDefinitionNode): DirectiveNode[] {
    let dirs = []
    for (const field of node.fields) {
        const fieldDirs = collectArgumentDirectives(field)
        dirs = dirs.concat(fieldDirs)
    }
    return dirs.concat(node.directives)
}

export function collectEnumDirectives(node: EnumTypeDefinitionNode): DirectiveNode[] {
    let dirs = []
    for (const val of node.values) {
        const valDirs = collectEnumValueDirectives(val)
        dirs = dirs.concat(valDirs)
    }
    return dirs.concat(node.directives)
}

export function collectEnumValueDirectives(node: EnumValueDefinitionNode): DirectiveNode[] {
    return [...(node.directives || [])]
}
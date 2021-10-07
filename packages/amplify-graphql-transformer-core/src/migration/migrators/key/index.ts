import { makeArgument, makeDirective } from 'graphql-transformer-common';

export function isPrimaryKey(directive: any): boolean {
    return (directive.name.value === 'key'
        && directive.arguments.some((a: any) => a.name.value === "fields")
        && !directive.arguments.some((a: any) => a.name.value === "name"));
}

export function migratePrimaryKey(node: any, directive: any) {
    let fields = directive.arguments.find((i: any) => i.name.value === "fields");
    const fieldIndex = node.fields.findIndex((field: any) => field.name.value === fields.value.values[0].value);
    let args: any[] = [];
    if (fields.value.values.length !== 1) {
        args = [makeArgument('sortKeyFields', {
                ...fields.value,
                values: fields.value.values.slice(1)
            }
        )];
    }
    node.fields[fieldIndex].directives.push(makeDirective('primaryKey', args));
}

export function isSecondaryKey(directive: any) {
    return (directive.name.value === 'key'
        && directive.arguments.some((a: any) => a.name.value === "fields")
        && directive.arguments.some((a: any) => a.name.value === "name"));
}

export function migrateSecondaryKey(node: any, directive: any) {
    let fields = directive.arguments.find((i: any) => i.name.value === "fields");
    const fieldIndex = node.fields.findIndex((field: any) => field.name.value === fields.value.values[0].value);
    let args = directive.arguments.filter((i: any) => i.name.value !== "fields");
    if (fields.value.values.length !== 1) {
        args = [...args, makeArgument(
            'sortKeyFields', {
                ...fields.value,
                values: fields.value.values.slice(1)
            },
        )];
    }
    node.fields[fieldIndex].directives.push(makeDirective('index', args));
}

export function migrateKeys(node: any) {
    const dirs = node.directives;
    if (!dirs) {
        return;
    }
    let keys = [];
    for (const dir of dirs) {
        if (dir.name.value === 'key') {
            keys.push(dir);
        }
    }
    node.directives = dirs.filter((dir: any) => dir.name.value !== "key");
    for (const index of keys) {
        if (isPrimaryKey(index)) {
            migratePrimaryKey(node, index);
        } else if (isSecondaryKey(index)) {
            migrateSecondaryKey(node, index);
        }
    }
}

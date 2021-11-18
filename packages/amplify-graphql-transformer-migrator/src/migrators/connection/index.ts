import { isListType } from 'graphql-transformer-common';

const validConnectionDirectiveNames = new Set(['hasOne', 'hasMany', 'connection']);

export function getFieldsWithConnection(fields: any) {
  return fields.filter((field: any) => field.directives.find((d: any) => d.name.value === 'connection'));
}

export function getConnectionFieldsArg(connection: any) {
  return connection.arguments.find((a: any) => a.name.value === 'fields').value.values.map((v: any) => v.value);
}

export function isFieldIndex(field: any) {
  return field.directives.some((dir: any) => dir.name.value === 'index');
}

export function getConnectionDirective(field: any) {
  return field.directives.find(
    (d: any) => d.name.value === 'connection' || d.name.value === 'hasMany' || d.name.value === 'hasOne' || d.name.value === 'belongsTo',
  );
}

function getRelatedType(output: any, relatedTypeName: any) {
  const relatedType = output.definitions.find((d: any) => d.kind === 'ObjectTypeDefinition' && d.name.value === relatedTypeName);

  return relatedType;
}

function getFieldType(field: any): any {
  if (field.type.kind === 'NamedType') {
    return field.type.name.value;
  } else {
    return getFieldType(field.type);
  }
}

export function migrateConnection(node: any, ast: any) {
  const connections = getFieldsWithConnection(node.fields);
  if (connections.length === 0) {
    return;
  }

  connections.forEach((connectionField: any) => {
    const connectionDirective = getConnectionDirective(connectionField);
    let typeIsList = isListType(connectionField.type);
    if (typeIsList) {
      connectionDirective.name.value = 'hasMany';
      const keyNameArg = connectionDirective.arguments.find((a: any) => a.name.value === 'keyName');

      if (keyNameArg) {
        keyNameArg.name.value = 'indexName';
      }
    } else {
      const relatedType = getRelatedType(ast, getFieldType(connectionField));
      const isBiDirectionalRelation = relatedType.fields.some((relatedField: any) => {
        if (getFieldType(relatedField) !== node.name.value) {
          return false;
        }

        const fieldsArg = node.fields.find((f: any) => f.name.value === getConnectionFieldsArg(connectionDirective)[0]);
        if (fieldsArg && !isFieldIndex(fieldsArg)) {
          return false;
        }

        return relatedField.directives.some((relatedDirective: any) => {
          return validConnectionDirectiveNames.has(relatedDirective.name.value);
        });
      });

      if (isBiDirectionalRelation) {
        connectionDirective.name.value = 'belongsTo';
      } else {
        connectionDirective.name.value = 'hasOne';
      }
    }
  });
}

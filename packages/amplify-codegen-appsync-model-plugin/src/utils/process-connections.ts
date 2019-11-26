import { CodeGenModel, CodeGenModelMap, CodeGenField } from '../visitors/appsync-visitor';
import { camelCase } from 'change-case';

export enum CodeGenConnectionType {
  HAS_ONE = 'HAS_ONE',
  BELONGS_TO = 'BELONGS_TO',
  HAS_MANY = 'HAS_MANY',
}

export type CodeGenConnectionTypeBase = {
  kind: CodeGenConnectionType;
  connectedModel: CodeGenModel;
};
export type CodeGenFieldConnectionBelongsTo = CodeGenConnectionTypeBase & {
  kind: CodeGenConnectionType.BELONGS_TO;
  targetName: string;
};
export type CodeGenFieldConnectionHasOne = CodeGenConnectionTypeBase & {
  kind: CodeGenConnectionType.HAS_ONE;
  associatedWith: CodeGenField;
};

export type CodeGenFieldConnectionHasMany = CodeGenConnectionTypeBase & {
  kind: CodeGenConnectionType.HAS_MANY;
  associatedWith: CodeGenField;
};

export type CodeGenFieldConnection = CodeGenFieldConnectionBelongsTo | CodeGenFieldConnectionHasOne | CodeGenFieldConnectionHasMany;

export function makeConnectionAttributeName(type: string, field?: string) {
  // The same logic is used graphql-connection-transformer package to generate association field
  // Make sure the logic gets update in that package
  return field ? camelCase([type, field, 'id'].join('_')) : camelCase([type, 'id'].join('_'));
}
export function processConnections(
  field: CodeGenField,
  model: CodeGenModel,
  modelMap: CodeGenModelMap
): CodeGenFieldConnection | undefined {
  const connectionDirective = field.directives.find(d => d.name === 'connection');
  if (connectionDirective) {
    const otherSide = modelMap[field.type];
    const connectionName = connectionDirective.name;
    const connectionFields = connectionDirective.arguments.fields || [];
    const otherSideField = otherSide.fields.find(f => {
      if (f.type === model.name) {
        const otherSideConnection = f.directives.find(d => d.name === 'connection');
        return otherSideConnection && connectionName == otherSideConnection.name;
      }
    });

    if (otherSideField) {
      // 2 way connection
      if (field.isList && !otherSideField.isList) {
        // Many to One
        return {
          kind: CodeGenConnectionType.HAS_MANY,
          associatedWith: otherSideField,
          connectedModel: otherSide,
        };
      } else if (!field.isList && otherSideField.isList) {
        //  One to Many
        if (connectionFields.length > 1) {
          // Todo: Move to a common function and update the error message
          throw new Error('DataStore only support one key in field');
        }
        return {
          kind: CodeGenConnectionType.BELONGS_TO,
          connectedModel: otherSide,
          targetName: connectionFields[0] || makeConnectionAttributeName(model.name, field.name),
        };
      } else if (!field.isList && !otherSideField.isList) {
        // One to One
        //  Data store can only support models where 1:1 connection, one of the connection side should be
        // Non null able to support the foreign key constrain.
        if (!field.isNullable && otherSideField.isNullable) {
          /*
          # model
          type Person { # hasOne
            license: License;
          }
          # otherSide
          type License { # belongsTo
            person: Person!
          }
          */
          return {
            kind: CodeGenConnectionType.BELONGS_TO,
            connectedModel: otherSide,
            targetName: connectionFields[0] || makeConnectionAttributeName(model.name, field.name),
          };
        } else if (field.isNullable && !otherSideField.isNullable) {
          /*
          # model
          type License { # belongsTo
            person: Person!
          }
          # otherSide
          type Person { # hasOne
            license: License;
          }
          */
          return { kind: CodeGenConnectionType.HAS_ONE, associatedWith: otherSideField, connectedModel: otherSide };
        } else {
          /*
          # model
          type License { # belongsTo
            person: Person!
          }
          # otherSide
          type Person { # hasOne
            license: License;
          }
          */
          throw new Error('DataStore does not support 1 to 1 connection with both sides of connection as optional field');
        }
      }
    } else {
      // one way connection
      if (field.isList) {
        const connectionFieldName = makeConnectionAttributeName(model.name, field.name);
        const existingConnectionField = otherSide.fields.find(f => f.name === connectionFieldName);
        return {
          kind: CodeGenConnectionType.HAS_MANY,
          connectedModel: otherSide,
          associatedWith: existingConnectionField || {
            name: connectionFieldName,
            type: 'ID',
            isList: false,
            isNullable: true,
            directives: [],
          },
        };
      } else {
        if (connectionFields.length > 1) {
          // Todo: Update the message
          throw new Error('DataStore only support one key in field');
        }
        return {
          kind: CodeGenConnectionType.BELONGS_TO,
          connectedModel: otherSide,
          targetName: connectionFields[0] || makeConnectionAttributeName(model.name, field.name),
        };
      }
    }
  }
}

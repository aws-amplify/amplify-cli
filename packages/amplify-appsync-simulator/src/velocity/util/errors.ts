import { GraphQLResolveInfo } from 'graphql';

export class TemplateSentError extends Error {
  extensions: any;
  constructor(message, errorType, data, errorInfo, info: GraphQLResolveInfo) {
    super(message);
    const fieldName = info.fieldName;
    let path = info.path;
    const pathArray = []
    do {
      pathArray.splice(0, 0, path.key);
      path = path.prev
    } while(path);

    const fieldNode = info.fieldNodes.find(f => f.name.value === fieldName);
    const filedLocation = fieldNode && fieldNode.loc.startToken || null;
    Object.assign(this, { message, errorType, data, errorInfo });
    this.extensions = {
      message: message,
      errorType,
      data,
      errorInfo,
      path: pathArray,
      locations: [
        filedLocation ? {
          line: filedLocation.line,
          column: filedLocation.column,
          sourceName: fieldNode.loc.source.name,
        } : [],
      ],
    };
  }
}

export class Unauthorized extends TemplateSentError {
  extensions: any;
  errorType: string;
  constructor(gqlMessage, info) {
    super(gqlMessage, 'Unauthorized', {}, {}, info);
  }
}
export class ValidateError extends Error {
  constructor(message, type, data) {
    super(message);
    Object.assign(this, { message, type, data });
  }
}

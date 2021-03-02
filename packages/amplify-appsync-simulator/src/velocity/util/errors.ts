import { GraphQLResolveInfo } from 'graphql';

export class TemplateSentError extends Error {
  extensions: any;
  constructor(public message: string, public errorType: string, public data: any, public errorInfo: any, info: GraphQLResolveInfo) {
    super(message);
    Object.setPrototypeOf(this, TemplateSentError.prototype);
    const fieldName = info.fieldName;
    let path = info.path;
    const pathArray = [];
    do {
      pathArray.splice(0, 0, path.key);
      path = path.prev;
    } while (path);

    const fieldNode = info.fieldNodes.find(f => f.name.value === fieldName);
    const filedLocation = (fieldNode && fieldNode.loc.startToken) || null;
    this.extensions = {
      message: message,
      errorType,
      data,
      errorInfo,
      path: pathArray,
      locations: [
        filedLocation
          ? {
              line: filedLocation.line,
              column: filedLocation.column,
              sourceName: fieldNode.loc.source.name,
            }
          : [],
      ],
    };
  }
}

export class Unauthorized extends TemplateSentError {
  constructor(gqlMessage, info: GraphQLResolveInfo) {
    super(gqlMessage, 'Unauthorized', {}, {}, info);
    Object.setPrototypeOf(this, Unauthorized.prototype);
  }
}
export class ValidateError extends TemplateSentError {
  constructor(public message: string, info: GraphQLResolveInfo, public type: string = 'CustomTemplateException', public data: any = null) {
    super(message, type, {}, {}, info);
    Object.setPrototypeOf(this, ValidateError.prototype);
  }
}

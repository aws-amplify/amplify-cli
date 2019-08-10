export class TemplateSentError extends Error {
  constructor(gqlMessage, errorType, data, errorInfo) {
    super(gqlMessage);
    Object.assign(this, { gqlMessage, errorType, data, errorInfo });
  }
}

export class Unauthorized extends TemplateSentError {
  extensions: any;
  errorType: string;
  constructor(gqlMessage) {
    super(gqlMessage, 'Unauthorized', {}, {});
    this.extensions = {
      errorType: 'Unauthorized',
    };
    this.errorType = 'Unauthorized';
  }
}
export class ValidateError extends Error {
  constructor(gqlMessage, type, data) {
    super(gqlMessage);
    Object.assign(this, { gqlMessage, type, data });
  }
}

export class JSONValidationError extends Error {
  constructor(message: string, public unknownFlags: string[], public otherErrors: string[]) {
    super(message);

    this.name = 'JSONValidationError';
  }
}

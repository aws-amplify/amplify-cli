export class JSONValidationError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'JSONValidationError';
  }
}

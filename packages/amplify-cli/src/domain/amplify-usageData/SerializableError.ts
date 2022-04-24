/**
 * Wrapper around Error.name
 */
export class SerializableError {
  name: string;
  constructor(error: Error) {
    this.name = error.name;
  }
}

import { GraphQLError } from 'graphql';
import * as os from 'os';

export class InvalidTransformerError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidTransformerError.prototype);
    this.name = 'InvalidTransformerError';
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, InvalidTransformerError);
    }
  }
}

export class SchemaValidationError extends Error {
  constructor(errors: Readonly<GraphQLError[]>) {
    super(`Schema Errors:\n\n${errors.join('\n')}`);
    Object.setPrototypeOf(this, SchemaValidationError.prototype);
    this.name = 'SchemaValidationError';
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, SchemaValidationError);
    }
  }
}

/**
 * Thrown by transformers when a user provided schema breaks some contract expected by the transformer.
 *
 * A contract issue is one that is not incorrect GraphQL but that violates
 * the semantics or contract required by the business logic of a transformer.
 * For example, the @versioned directive requires the provided "versionField" to be
 * of an Int or BigInt type.
 */
export class TransformerContractError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, TransformerContractError.prototype);
    this.name = 'TransformerContractError';
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, TransformerContractError);
    }
  }
}

export class DestructiveMigrationError extends Error {
  constructor(message: string, private removedModels: string[], private replacedModels: string[]) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'DestructiveMigrationError';
    const prependSpace = (str: string) => ` ${str}`;
    const removedModelsList = this.removedModels.map(prependSpace).toString().trim();
    const replacedModelsList = this.replacedModels.map(prependSpace).toString().trim();
    if (removedModelsList && replacedModelsList) {
      this.message = `${this.message}${os.EOL}This update will remove table(s) [${removedModelsList}] and will replace table(s) [${replacedModelsList}]`;
    } else if (removedModelsList) {
      this.message = `${this.message}${os.EOL}This update will remove table(s) [${removedModelsList}]`;
    } else if (replacedModelsList) {
      this.message = `${this.message}${os.EOL}This update will replace table(s) [${replacedModelsList}]`;
    }
    this.message = `${this.message}${os.EOL}ALL EXISTING DATA IN THESE TABLES WILL BE LOST!${os.EOL}If this is intended, rerun the command with '--allow-destructive-graphql-schema-updates'.`;
  }
  toString = () => this.message;
}

/**
 * Thrown by the sanity checker when a user is trying to make a migration that is known to not work.
 */
export class InvalidMigrationError extends Error {
  constructor(message: string, public cause: string, public fix: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'InvalidMigrationError';
  }
  toString = () => `${this.message}\nCause: ${this.cause}\nHow to fix: ${this.fix}`;
}

export class InvalidGSIMigrationError extends InvalidMigrationError {
  fix: string;
  cause: string;
  constructor(message: string, cause: string, fix: string) {
    super(message, cause, fix);
    this.name = 'InvalidGSIMigrationError';
  }
}

export class InvalidDirectiveError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidDirectiveError.prototype);
    this.name = 'InvalidDirectiveError';
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, InvalidDirectiveError);
    }
  }
}

export class UnknownDirectiveError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, UnknownDirectiveError.prototype);
    this.name = 'UnknownDirectiveError';
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, UnknownDirectiveError);
    }
  }
}

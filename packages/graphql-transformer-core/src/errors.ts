import { GraphQLError, printError } from 'graphql';
import * as os from 'os';

const GRAPHQL_TRANSFORMER_V2_DIRECTIVES = ['hasOne', 'index', 'primaryKey', 'belongsTo', 'manyToMany', 'hasMany', 'default'];
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
    const v2DirectivesInUse = new Set<string>();
    const newErrors = errors.filter(error => {
      if (!error.message.startsWith('Unknown directive')) {
        return true;
      }
      const dir = GRAPHQL_TRANSFORMER_V2_DIRECTIVES.find(d => error.message.endsWith(`"${d}".`));
      if (!dir) {
        return true;
      }
      v2DirectivesInUse.add(dir);
      return false;
    });

    if (v2DirectivesInUse.size > 0) {
      const v2DirectiveErrorMessage = `Your GraphQL Schema is using ${Array.from(v2DirectivesInUse.values())
        .map(d => `"@${d}"`)
        .join(', ')} ${
        v2DirectivesInUse.size > 1 ? 'directives' : 'directive'
      } from the newer version of the GraphQL Transformer. Visit https://docs.amplify.aws/cli/migration/transformer-migration/ to learn how to migrate your GraphQL schema.`;
      if (newErrors.length === 0) {
        super(v2DirectiveErrorMessage);
      } else {
        super(
          v2DirectiveErrorMessage +
            ` There are additional validation errors listed below: \n\n ${newErrors.map(error => printError(error)).join('\n\n')}`,
        );
      }
    } else {
      super(`Schema validation failed.\n\n${newErrors.map(error => printError(error)).join('\n\n')} `);
    }
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

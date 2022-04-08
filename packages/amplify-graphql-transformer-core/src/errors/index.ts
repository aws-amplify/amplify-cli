import { GraphQLError, printError } from 'graphql';

const GRAPHQL_TRANSFORMER_V1_DIRECTIVES = ['connection', 'key', 'versioned'];
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
    const v1DirectivesInUse = new Set<string>();
    const newErrors = errors.filter(error => {
      if (!error.message.startsWith('Unknown directive')) {
        return true;
      }
      const dir = GRAPHQL_TRANSFORMER_V1_DIRECTIVES.find(d => error.message.endsWith(`"${d}".`));
      if (!dir) {
        return true;
      }
      v1DirectivesInUse.add(dir);
      return false;
    });
    if (v1DirectivesInUse.size > 0) {
      const baseErrorMessage = `Your GraphQL Schema is using ${Array.from(v1DirectivesInUse.values())
        .map(d => `"@${d}"`)
        .join(', ')} ${
        v1DirectivesInUse.size > 1 ? 'directives' : 'directive'
      } from an older version of the GraphQL Transformer. Visit https://docs.amplify.aws/cli/migration/transformer-migration/ to learn how to migrate your GraphQL schema.`;

      if (newErrors.length === 0) {
        super(baseErrorMessage);
      } else {
        super(
          baseErrorMessage +
            ` There are additional validation errors listed below \n\n ${newErrors.map(error => printError(error)).join('\n\n')}`,
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

/**
 * Thrown by the sanity checker when a user is trying to make a migration that is known to not work.
 */
export class InvalidMigrationError extends Error {
  fix: string;
  reason: string;
  constructor(message: string, reason: string, fix: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidMigrationError.prototype);
    this.name = 'InvalidMigrationError';
    this.fix = fix;
    this.reason = reason;
  }
}
InvalidMigrationError.prototype.toString = function () {
  return `${this.message}\nCause: ${this.reason}\nHow to fix: ${this.fix}`;
};

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

import { GraphQLError } from 'graphql'

export class InvalidTransformerError extends Error {

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidTransformerError.prototype);
        this.name = "InvalidTransformerError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, InvalidTransformerError)
        }
    }
}

export class SchemaValidationError extends Error {

    constructor(errors: GraphQLError[]) {
        super(`Schema Errors:\n\n${errors.join('\n')}`);
        Object.setPrototypeOf(this, SchemaValidationError.prototype);
        this.name = "SchemaValidationError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, SchemaValidationError)
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
        this.name = "TransformerContractError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, TransformerContractError)
        }
    }
}

/**
 * Thrown by the sanity checker when a user is trying to make a migration that is known to not work.
 */
export class InvalidMigrationError extends Error {
    fix: string;
    cause: string;
    constructor(message: string, cause: string, fix: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidMigrationError.prototype);
        this.name = "InvalidMigrationError";
        this.fix = fix;
        this.cause = cause;
    }
}
InvalidMigrationError.prototype.toString = function() {
    return `${this.message}\nCause: ${this.cause}\nHow to fix: ${this.fix}`;
}

export class InvalidDirectiveError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidDirectiveError.prototype);
        this.name = "InvalidDirectiveError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, InvalidDirectiveError)
        }
    }
}

export class UnknownDirectiveError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, UnknownDirectiveError.prototype);
        this.name = "UnknownDirectiveError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, UnknownDirectiveError)
        }
    }
}

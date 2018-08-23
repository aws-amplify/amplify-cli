import { GraphQLError } from 'graphql'

export class InvalidTransformerError extends Error {

    constructor(message: string) {
        super(message);
        this.name = "InvalidTransformerError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, InvalidTransformerError)
        }
    }
}

export class SchemaValidationError extends Error {

    constructor(errors: GraphQLError[]) {
        super(`Schema Errors:\n\n${errors.join('\n')}`);
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
        this.name = "TransformerContractError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, TransformerContractError)
        }
    }
}

export class InvalidDirectiveError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidDirectiveError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, InvalidDirectiveError)
        }
    }
}

export class UnknownDirectiveError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UnknownDirectiveError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, UnknownDirectiveError)
        }
    }
}

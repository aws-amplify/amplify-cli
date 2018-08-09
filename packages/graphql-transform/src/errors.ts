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

export class TransformSchemaError extends Error {

    constructor(errors: GraphQLError[]) {
        super(`Schema Errors:\n\n${errors.join('\n')}`);
        this.name = "TransformSchemaError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, TransformSchemaError)
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

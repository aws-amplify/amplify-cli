/**
 * Internal error to the codegen library.
 * Something went wrong that we didn't expect while executing code generation for input that
 * passed input verification.
 */
export declare class InternalError extends Error {
    constructor(message: string);
}
/**
 * Unexpected input was provided to the codegen library, and we don't expect retrying will help in resolving.
 */
export declare class InvalidInputError extends Error {
    constructor(message: string);
}

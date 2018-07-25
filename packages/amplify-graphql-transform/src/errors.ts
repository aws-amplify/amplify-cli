export class InvalidTransformerError extends Error {

    constructor(message: string) {
        super(message);
        this.name = "InvalidTransformerError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, InvalidTransformerError)
        }
    }
}

export class InvalidDirectiveDefinitionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidDirectiveDefinitionError";
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, InvalidDirectiveDefinitionError)
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
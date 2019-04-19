export class RelationalDBParsingException extends Error {
    constructor(message: string, stack?: string) {
        super(message)

        Object.setPrototypeOf(this, RelationalDBParsingException.prototype)
        this.stack = stack
    }
}
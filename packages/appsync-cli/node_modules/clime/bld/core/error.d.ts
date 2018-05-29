/// <reference types="node" />
import ExtendableError from 'extendable-error';
import { Printable } from '.';
export declare class ExpectedError extends ExtendableError implements Printable {
    code: number;
    constructor(message: string, code?: number);
    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void;
}

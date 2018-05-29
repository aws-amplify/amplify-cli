import { CLI } from '../core';
/**
 * A Clime command line interface shim for pure Node.js.
 */
export declare class Shim {
    cli: CLI;
    constructor(cli: CLI);
    /**
     * Execute CLI with an array as `argv`.
     * @param argv - The `argv` array to execute, typically `process.argv`.
     * @param cwd - Current working directory.
     */
    execute(argv: string[], cwd?: string): Promise<void>;
}

/**
 * Mocks `getCLIpath` with the path to a specific version of Amplify.
 *
 * Ideally we could use this in migration tests directly without spying on getCLIPath but that's going to require a larger test refactoring
 *
 * Be careful if using this class with test.concurrent as one test may step on the version of another test.
 */
declare class CLIVersionController {
    #private;
    /**
     * All CLI calls (that use getCLIVersion) will use the specified CLI version
     */
    useCliVersion: (version: string) => Promise<void>;
    /**
     * Resets getCLIVersion to its original implementation
     */
    resetCliVersion: () => void;
    private getCLIVersionPath;
}
export declare const cliVersionController: CLIVersionController;
export {};

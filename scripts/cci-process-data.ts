import { join } from "path";
import { getTestFileRunTimes, getTestFiles, REPO_ROOT, saveTestTimings } from "./cci-utils";

function main(): void {
    let testSuites = getTestFiles(join(REPO_ROOT, 'packages', 'amplify-e2e-tests'));
    testSuites.push(...getTestFiles(join(REPO_ROOT, 'packages', 'amplify-migration-tests')));
    const runTimes = getTestFileRunTimes(testSuites);
    saveTestTimings({
        lastUpdated: new Date().toISOString(),
        totalTestFiles: runTimes.length,
        timingData: runTimes
    });
}
main();
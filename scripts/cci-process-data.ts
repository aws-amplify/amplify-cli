import { join } from "path";
import { getOldJobNameWithoutSuffixes, getTestFiles, getTimingsFromJobsData, REPO_ROOT, saveTestTimings } from "./cci-utils";

function main(): void {
    let testSuites = getTestFiles(join(REPO_ROOT, 'packages', 'amplify-e2e-tests'));
    testSuites.push(...getTestFiles(join(REPO_ROOT, 'packages', 'amplify-migration-tests')));
    const jobTimings = getTimingsFromJobsData();
    const testRuntimes = testSuites.map(t => {
        const oldName = getOldJobNameWithoutSuffixes(t);
        if(jobTimings.has(oldName)){
            return {
                test: t,
                medianRuntime: jobTimings.get(oldName) as number
            }
        } else {
            console.log("Could not find timing for:", t);
            return {
                test: t,
                medianRuntime: 10 // default for unknown
            }
        }
    })
    testRuntimes.sort((a,b) => {
        return a.medianRuntime - b.medianRuntime;
    });
    saveTestTimings({
        lastUpdated: new Date().toISOString(),
        totalTestFiles: testRuntimes.length,
        timingData: testRuntimes
    });
}
main();
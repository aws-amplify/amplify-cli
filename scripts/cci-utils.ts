import * as glob from 'glob';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { CircleCIConfig } from './cci-types';

// Ensure to update packages/amplify-e2e-tests/src/cleanup-e2e-resources.ts is also updated this gets updated
export const AWS_REGIONS_TO_RUN_TESTS = [
    'us-east-1',
    'us-east-2',
    'us-west-2',
    'eu-west-2',
    'eu-central-1',
    'ap-northeast-1',
    'ap-southeast-1',
    'ap-southeast-2',
];

// Some services (eg. amazon lex) are not available in all regions
// Tests added to this list will always run in us-west-2
export const FORCE_US_WEST_2 = ['interactions'];

// some tests require additional time, the parent account can handle longer tests (up to 90 minutes)
export const USE_PARENT_ACCOUNT = [
    'import_dynamodb_1',
    'import_s3_1',
    'searchable-migration',
];

export const REPO_ROOT = join(__dirname, '..');

export function getTestFiles(dir: string, pattern = 'src/**/*.test.ts'): string[] {
    return glob.sync(pattern, { cwd: dir });
}

/**
 * CircleCI test data is different from job data; each job may have multiple test files,
 * and each test file may contain multiple tests. 
 * CircleCI reports this data at the testfile + testname specificity.
 * 
 * The data in this file is at the TEST level.
 */
export function loadTestData(): any {
    const testData = join(REPO_ROOT, 'scripts', 'cci-test.data.json');
    return JSON.parse(fs.readFileSync(testData, 'utf-8'));
}
export function saveTestData(data: any): any {
    const testData = join(REPO_ROOT, 'scripts', 'cci-test.data.json');
    fs.writeFileSync(testData, JSON.stringify(data, null, 2));
}

/**
 * CircleCI job data contains data for each job.
 * 
 * The data in this file is at the JOB level.
 */
export function loadJobData(): any {
    const testData = join(REPO_ROOT, 'scripts', 'cci-job.data.json');
    return JSON.parse(fs.readFileSync(testData, 'utf-8'));
}
export function saveJobData(data: any): any {
    const testData = join(REPO_ROOT, 'scripts', 'cci-job.data.json');
    fs.writeFileSync(testData, JSON.stringify(data, null, 2));
}

/**
 * CircleCI job data contains data for each job.
 * 
 * The data in this file is at the JOB level.
 */
export function loadTestTimings(): { timingData: { test: string, medianRuntime: number }[] }{
    const testData = join(REPO_ROOT, 'scripts', 'cci-test-timings.data.json');
    return JSON.parse(fs.readFileSync(testData, 'utf-8'));
}
export function saveTestTimings(data: any): any {
    const testData = join(REPO_ROOT, 'scripts', 'cci-test-timings.data.json');
    fs.writeFileSync(testData, JSON.stringify(data, null, 2));
}

/**
 * Config file
 */
export function loadConfig(): CircleCIConfig {
    const configFile = join(REPO_ROOT, '.circleci', 'config.base.yml');
    return <CircleCIConfig>yaml.load(fs.readFileSync(configFile, 'utf8'));
}
export function saveConfig(config: CircleCIConfig): void {
    const configFile = join(REPO_ROOT, '.circleci', 'generated_config.yml');
    const output = ['# auto generated file. Edit config.base.yaml if you want to change', yaml.dump(config, { noRefs: true })];
    fs.writeFileSync(configFile, output.join('\n'));
}

export const getOldJobNameWithoutSuffixes = (
    testSuitePath: string): string  => {
    const startIndex = testSuitePath.lastIndexOf('/') + 1;
    const endIndex = testSuitePath.lastIndexOf('.test');
    return testSuitePath.substring(startIndex, endIndex).split('.e2e').join('').split('.').join('-');
}

/**
 * The is how we generated job names when each file was assigned to a single job.
 * 
 * @param baseJobName The root level folder (amplify-e2e-tests, amplify-migration-tests, etc...)
 * @param testSuitePath The test file name (some-e2e-test.e2e.test.ts, some-test.test.ts)
 * @returns 
 */
export function getOldJobName(baseJobName: string, testSuitePath: string): string {
    const startIndex = testSuitePath.lastIndexOf('/') + 1;
    const endIndex = testSuitePath.lastIndexOf('.test');
    let name = testSuitePath.substring(startIndex, endIndex).split('.e2e').join('').split('.').join('-');
    if (baseJobName.includes('pkg')) {
      name = name + '_pkg';
    }
    if (baseJobName.includes('amplify_migration_tests')) {
      const startIndex = baseJobName.lastIndexOf('_');
      name = name + baseJobName.substring(startIndex);
    }
    return name;
}

function getTestNameFromOldJobName(jobName: string){
    // first, remove any _pkg-<executor> from the name
    let name = jobName.split('_pkg-')[0];

    // remove migration suffixes
    name = name.split('_v10-')[0];
    name = name.split('_v5-')[0];
    name = name.split('_v6-')[0];
    return name;
}

export function getTimingsFromJobsData() {
    const jobData = loadJobData();
    const jobTimings: Map<string, number> = new Map();
    for(let job of jobData.items){
        const testName = getTestNameFromOldJobName(job.name);
        const duration = Math.floor(job.metrics.duration_metrics.median / 60);
        if(jobTimings.has(testName)){
            jobTimings.set(testName, Math.max(jobTimings.get(testName)!, duration))
        } else {
            jobTimings.set(testName, duration);
        }
    }
    return jobTimings;
}

export const getSlowestTestsRunTimes = (testSuites: string[]) => {
    const testData = loadTestData();
    // default sorted by slowest -> fastest
    const slowestTests: any[] = testData.slowest_tests.map((t:any) => {
        return {
            file: t.file,
            duration: Math.floor(t.p95_duration / 60)
        }
    })

    return testSuites.map(t => {
        let slowTest = slowestTests.find(slowTest => slowTest.file === t);
        if(slowTest){
            return {
                test: t,
                mins: slowTest.duration
            }
        } else {
            return {
                test: t,
                mins: 10 // all "not slow" tests run in about 10 mins or less
            }
        }
    })
}
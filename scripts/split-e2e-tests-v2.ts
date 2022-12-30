import { 
    CircleCIConfig, 
    WorkflowJob,
    repoRoot,
    generateJobName as oldJobName,
    WINDOWS_TEST_SKIP_LIST, 
    USE_PARENT_ACCOUNT, 
    AWS_REGIONS_TO_RUN_TESTS as regions,
    FORCE_US_WEST_2,
    getTestFiles,
    getLastBatchJobs,
    replaceWorkflowDependency,
    removeWorkflowJob
} from "./split-e2e-tests";
const TEST_EXCLUSIONS: { l: string[], w: string[] } = {
    l: [],
    w: [
        'amplify-app_pkg',
        'analytics-2_pkg',
        'api_2_pkg',
        'api_5_pkg',
        'datastore-modelgen_pkg',
        'delete_pkg',
        'diagnose_pkg',
        'env-2_pkg',
        'export_pkg',
        'function_1_pkg',
        'function_3a_pkg',
        'function_3b_pkg',
        'function_4_pkg',
        'function_6_pkg',
        'function_7_pkg',
        'function_8_pkg',
        'geo-add-e_pkg',
        'geo-add-f_pkg',
        'geo-remove-2_pkg',
        'geo-remove-3_pkg',
        'geo-update-1_pkg',
        'geo-update-2_pkg',
        'git-clone-attach_pkg',
        'hooks-a_pkg',
        'import_auth_1a_pkg',
        'import_auth_1b_pkg',
        'import_auth_2a_pkg',
        'import_auth_2b_pkg',
        'import_auth_3_pkg',
        'import_dynamodb_2a_pkg',
        'import_dynamodb_2c_pkg',
        'import_s3_2a_pkg',
        'import_s3_2c_pkg',
        'layer-2_pkg',
        'mock-api_pkg',
        'model-migration_pkg',
        'notifications-analytics-compatibility-in-app-1_pkg',
        'notifications-analytics-compatibility-sms-1_pkg',
        'notifications-analytics-compatibility-sms-2_pkg',
        'notifications-in-app-messaging-env-1_pkg',
        'notifications-in-app-messaging-env-2_pkg',
        'notifications-lifecycle_pkg',
        'notifications-sms_pkg',
        'notifications-sms-pull_pkg',
        'pull_pkg',
        'schema-iterative-rollback-1_pkg',
        'schema-iterative-rollback-2_pkg',
        'searchable-migration_pkg',
        'storage-5_pkg',
        'studio-modelgen_pkg',
        'uibuilder_pkg',
    ],
}
const MAX_TESTS_PER_JOB = 3;
type OS_TYPE = 'w' | 'l';
type CandidateJob = {
    region: string,
    os: OS_TYPE,
    executor: string,
    tests: string[],
    // intentially leaving this here - accounts are randomly assigned to jobs 
    // by a via local_publish_helpers.sh script
    // account: string, 
}
type Job = CandidateJob & {
    name: string;
    requiredJobs: string[];
}

const createRandomJob = (os: OS_TYPE) : CandidateJob => {
    const region = regions[Math.floor(Math.random() * regions.length)];
    return {
        region,
        os,
        executor: os === 'l' ? 'l_large' : 'w_medium',
        tests: []
    }
}


const getShortNameForTestSuite = (
    testSuitePath: string): string  => {
    const startIndex = testSuitePath.lastIndexOf('/') + 1;
    const endIndex = testSuitePath.lastIndexOf('.test');
    return testSuitePath.substring(startIndex, endIndex).split('.e2e').join('').split('.').join('-');
}
// const splitPkgTests = splitTests(
//     config,
//     'amplify_e2e_tests_pkg',
//     'build_test_deploy_v3',
//     join(repoRoot, 'packages', 'amplify-e2e-tests'),
//     CONCURRENCY,
//     undefined
//   );
export const splitTestsV2 = function splitTests(
    config: Readonly<CircleCIConfig>,
    jobTag: string,
    baseJobName: string,
    workflowName: string,
    jobRootDir: string,
    isMigration: boolean,
    pickTests: ((testSuites: string[]) => string[]) | undefined,
  ): CircleCIConfig {
    const output: CircleCIConfig = { ...config };
    const baseJobs = { ...config.jobs };
    const baseJob = baseJobs[baseJobName];
    
    let testSuites = getTestFiles(jobRootDir);
    if(pickTests && typeof pickTests === 'function'){
        testSuites = pickTests(testSuites);
    }
    if(testSuites.length === 0){
        return output;
    }

    const generateJobsForOS = (os: OS_TYPE) => {
        // migration tests are not supported for windows
        if(isMigration && os === 'w'){
            return [];
        }
        const osJobs = [createRandomJob(os)];
        for(let test of testSuites){
            const currentJob = osJobs[osJobs.length - 1];

            // if the current test is excluded from this OS, skip it
            const oldName = oldJobName(baseJobName, test);
            if(TEST_EXCLUSIONS[os].find(excluded => oldName === excluded)) {
                continue;
            }

            // some tests only run on us-west-2, we can just switch the region
            if(FORCE_US_WEST_2.find(t => oldName.startsWith(t))){
                currentJob.region = 'us-west-2';
            }

            // add the test
            currentJob.tests.push(test);
        
            // create a new job once the current job is full;
            // migration tests are 1-1 due to limitations with older cli versions
            if(isMigration || currentJob.tests.length >= MAX_TESTS_PER_JOB){
                osJobs.push(createRandomJob(os));
            }
        }
        return osJobs;
    }
    const linuxJobs = generateJobsForOS('l');
    const windowsJobs = generateJobsForOS('w');
    
    // create the new job configurations, which will be added to the "jobs"
    // section of the CircleCI config file
    let newJobConfigurations = {};
    const generateJobConfigurations = (jobs: CandidateJob[]) => {
        let index = 0;
        for(let j of jobs){
            if(j.tests.length === 0){
                continue;
            }
            const firstTestName = getShortNameForTestSuite(j.tests[0]);
            const jobName = `${j.os}_${jobTag}_${firstTestName.charAt(0)}_${index}`;
            newJobConfigurations = {
                ...newJobConfigurations,
                [jobName]: {
                    ...baseJob,
                    environment: {
                        ...(baseJob?.environment || {}),
                        TEST_SUITE: j.tests.join('|'),
                        CLI_REGION: j.region,
                    }
                }
            }
            index ++;
        }
    }
    generateJobConfigurations(linuxJobs);
    generateJobConfigurations(windowsJobs);


    // Spilt jobs by region
    const jobByRegion = Object.entries(newJobConfigurations).reduce((acc: Record<string, any>, entry: [string, any]) => {
        const [jobName, job] = entry;
        const region = job?.environment?.CLI_REGION;
        const regionJobs = { ...acc[region], [jobName]: job };
        return { ...acc, [region]: regionJobs };
    }, {});

    const workflows = { ...config.workflows };

    if (workflows[workflowName]) {
        const workflow = workflows[workflowName];

        const workflowJob = workflow.jobs.find(j => {
        if (typeof j === 'string') {
            return j === baseJobName;
        } else {
            const name = Object.keys(j)[0];
            return name === baseJobName;
        }
        });

        if (workflowJob) {
        Object.values(jobByRegion).forEach(regionJobs => {
            const newJobNames = Object.keys(regionJobs as object);
            const jobs = newJobNames.map((newJobName, index) => {
                if (typeof workflowJob === 'string') {
                    return newJobName;
                } else {
                    let requiredJobs = workflowJob[baseJobName].requires || [];
                    // don't need to wait on windows if this is a linux test
                    if (newJobName.startsWith('l')) {
                        requiredJobs = requiredJobs.filter(j => j !== 'build_windows_workspace_for_e2e');
                    }
                    return {
                        [newJobName]: {
                            ...Object.values(workflowJob)[0],
                            requires: requiredJobs,
                            matrix: {
                                parameters: {
                                    os: newJobName.startsWith('l') ? (isMigration ? ['l_medium'] : ['l_large']) : ['w_medium']
                                },
                            },
                        },
                    };
                }
            });
            workflow.jobs = [...workflow.jobs, ...jobs];
        });

        const lastJobBatch = Object.values(jobByRegion)
            .map(regionJobs => getLastBatchJobs(Object.keys(regionJobs as Object), 50))
            .reduce((acc, val) => acc.concat(val), []);
        const filteredJobs = replaceWorkflowDependency(removeWorkflowJob(workflow.jobs, baseJobName), baseJobName, lastJobBatch);
        workflow.jobs = filteredJobs;
        }
        output.workflows = workflows;
    }
    output.jobs = {
        ...output.jobs,
        ...newJobConfigurations,
    };
    return output;
  }
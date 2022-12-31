import { CircleCIConfig, WorkflowJob } from "./cci-types";
import { FORCE_US_WEST_2, getOldJobName, getOldJobNameWithoutSuffixes, loadTestTimings, USE_PARENT_ACCOUNT } from './cci-utils';
import {
    AWS_REGIONS_TO_RUN_TESTS as regions, 
    getTestFiles
} from "./cci-utils";
const RUN_SOLO = [
    'auth_2e_pkg',
    'notifications-in-app-messaging_pkg',
]
const TEST_EXCLUSIONS: { l: string[], w: string[] } = {
    l: [],
    w: [
        'amplify-app_pkg',
        'analytics-2_pkg',
        'api_2a_pkg',
        'api_2b_pkg',
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
const MAX_WORKERS = 3;
type OS_TYPE = 'w' | 'l';
type CandidateJob = {
    region: string,
    os: OS_TYPE,
    executor: string,
    tests: string[],
    useParentAccount: boolean,
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
        tests: [],
        useParentAccount: false,
    }
}



export const splitTestsV2 = function splitTests(
    config: Readonly<CircleCIConfig>,
    counts: { w: number, l: number},
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
    const testFileRunTimes = loadTestTimings().timingData;

    testSuites.sort((a, b) => {
        const runtimeA = testFileRunTimes.find((t) => t.test === a)?.medianRuntime ?? 30;
        const runtimeB = testFileRunTimes.find((t) => t.test === b)?.medianRuntime ?? 30;
        return runtimeA - runtimeB;
    });

    const generateJobsForOS = (os: OS_TYPE) => {
        // migration tests are not supported for windows
        if(isMigration && os === 'w'){
            return [];
        }
        const soloJobs = [];
        const osJobs = [createRandomJob(os)];
        for(let test of testSuites){
            const currentJob = osJobs[osJobs.length - 1];

            // if the current test is excluded from this OS, skip it
            const oldName = getOldJobName(baseJobName, test);
            if(TEST_EXCLUSIONS[os].find(excluded => oldName === excluded)) {
                continue;
            }
            const US_WEST_2 = FORCE_US_WEST_2.find(t => oldName.startsWith(t));
            const USE_PARENT = USE_PARENT_ACCOUNT.some((usesParent) => oldName.startsWith(usesParent));

            if(RUN_SOLO.find(solo => oldName === solo)){
                const newSoloJob = createRandomJob(os);
                newSoloJob.tests.push(test);
                if(US_WEST_2){
                    newSoloJob.region = 'us-west-2';
                }
                if(USE_PARENT){
                    newSoloJob.useParentAccount = true;
                }
                soloJobs.push(newSoloJob);
                continue;
            }

            // add the test
            currentJob.tests.push(test);
            if(US_WEST_2){
                currentJob.region = 'us-west-2';
            }
            if(USE_PARENT){
                currentJob.useParentAccount = true;
            }
        
            // create a new job once the current job is full;
            // migration tests are 1-1 due to limitations with older cli versions
            if(isMigration || currentJob.tests.length >= MAX_WORKERS){
                osJobs.push(createRandomJob(os));
            }
        }
        return [...osJobs, ...soloJobs];
    }
    const linuxJobs = generateJobsForOS('l');
    const windowsJobs = generateJobsForOS('w');
    
    // create the new job configurations, which will be added to the "jobs"
    // section of the CircleCI config file
    let newJobConfigurations = {};
    const generateJobConfigurations = (jobs: CandidateJob[]) => {
        for(let j of jobs){
            if(j.tests.length === 0){
                continue;
            }
            const names = j.tests.map(tn => getOldJobNameWithoutSuffixes(tn)).join('_');
            // const jobName = `${j.os}_${j.os === 'l' ? counts.l : counts.w }${isMigration ? '_migration' : ''}`;
            let jobName = `${j.os}_${names}`;
            if(isMigration){
                const startIndex = baseJobName.lastIndexOf('_');
                jobName = jobName + baseJobName.substring(startIndex);
            }

            newJobConfigurations = {
                ...newJobConfigurations,
                [jobName]: {
                    ...baseJob,
                    environment: {
                        ...(baseJob?.environment || {}),
                        TEST_SUITE: j.tests.join('|'),
                        CLI_REGION: j.region,
                        ...(j.useParentAccount ? { USE_PARENT_ACCOUNT: 1 } : {})
                    }
                }
            }
            if(j.os === 'l'){
                counts.l ++;
            } else {
                counts.w ++;
            }
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
        Object.values(jobByRegion).forEach((regionJobs: any) => {
            const newJobNames = Object.keys(regionJobs as object);
            const jobs = newJobNames.map((newJobName, index) => {
                if (typeof workflowJob === 'string') {
                    return newJobName;
                } else {
                    const isSingleTest = regionJobs[newJobName].environment.TEST_SUITE.split('|').length === 1;
                    let requiredJobs = workflowJob[baseJobName].requires || [];
                    // don't need to wait on windows if this is a linux test
                    if (newJobName.startsWith('l')) {
                        requiredJobs = requiredJobs.filter(j => j !== 'build_windows_workspace_for_e2e');
                    }
                    // we can downsize on linux
                    let runner = (isMigration || isSingleTest) ? 'l_medium' : 'l_large';
                    if(!newJobName.startsWith('l')){
                        runner = 'w_medium';// w_medium is the smallest we can go for windows
                    }
                    return {
                        [newJobName]: {
                            ...Object.values(workflowJob)[0],
                            requires: requiredJobs,
                            matrix: {
                                parameters: {
                                    os: [runner]
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


  /**
 * CircleCI workflow can have multiple jobs. This helper function removes the jobName from the workflow
 * @param jobs - All the jobs in workflow
 * @param jobName - job that needs to be removed from workflow
 */
export function removeWorkflowJob(jobs: WorkflowJob[], jobName: string): WorkflowJob[] {
    return jobs.filter(j => {
      if (typeof j === 'string') {
        return j !== jobName;
      } else {
        const name = Object.keys(j)[0];
        return name !== jobName;
      }
    });
}
  
/**
 *
 * @param jobs array of job names
 * @param concurrency number of concurrent jobs
 */
export function getLastBatchJobs(jobs: string[], concurrency: number): string[] {
    const lastBatchJobLength = Math.min(concurrency, jobs.length);
    const lastBatchJobNames = jobs.slice(jobs.length - lastBatchJobLength);
    return lastBatchJobNames;
}
  
/**
 * A job in workflow can require some other job in the workflow to be finished before executing
 * This helper method finds and replaces jobName with jobsToReplacesWith
 * @param jobs - Workflow jobs
 * @param jobName - job to remove from requires
 * @param jobsToReplaceWith - jobs to add to requires
 */
export function replaceWorkflowDependency(jobs: WorkflowJob[], jobName: string, jobsToReplaceWith: string[]): WorkflowJob[] {
    return jobs.map(j => {
      if (typeof j === 'string') return j;
      const [currentJobName, jobObj] = Object.entries(j)[0];
      const requires = jobObj.requires || [];
      if (requires.includes(jobName)) {
        jobObj.requires = [...requires.filter(r => r !== jobName), ...jobsToReplaceWith];
      }
      return {
        [currentJobName]: jobObj,
      };
    });
}
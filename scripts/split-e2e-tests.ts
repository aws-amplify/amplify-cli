import * as yaml from 'js-yaml';
import * as glob from 'glob';
import { join } from 'path';
import * as fs from 'fs-extra';

const CONCURRENCY = 3;

export type WorkflowJob =
  | {
      [name: string]: {
        requires?: string[];
      };
    }
  | string;

export type CircleCIConfig = {
  jobs: {
    [name: string]: {
      steps: Record<string, any>;
    };
  };
  workflows: {
    [workflowName: string]: {
      jobs: WorkflowJob[];
    };
  };
};

function getTestFiles(dir: string, pattern = '**/*.test.ts'): string[] {
  return glob.sync(pattern, { cwd: dir });
}

function generateJobName(baseName: string, testSuitePath: string): string {
  return `${testSuitePath
    .replace('src/', '')
    .replace('__tests__/', '')
    .replace(/test\.ts$/, '')
    .replace(/\//g, '-')
    .replace(/\./g, '-')}${baseName}`;
}

/**
 * Takes a CircleCI config and converts each test inside that job into a separate
 * job.
 * @param config - CircleCI config
 * @param jobName - job that should be split
 * @param workflowName - workflow name where this job is run
 * @param jobRootDir - Directory to scan for test files
 * @param concurrency - Number of parallel jobs to run
 */
function splitTests(
  config: Readonly<CircleCIConfig>,
  jobName: string,
  workflowName: string,
  jobRootDir: string,
  concurrency: number = CONCURRENCY,
): CircleCIConfig {
  const output: CircleCIConfig = { ...config };
  const jobs = { ...config.jobs };
  const job = jobs[jobName];
  const testSuites = getTestFiles(jobRootDir);

  const newJobs = testSuites.reduce((acc, suite) => {
    const newJob = {
      ...job,
      environment: {
        TEST_SUITE: suite,
      },
    };
    const newJobName = generateJobName(jobName, suite);
    return { ...acc, [newJobName]: newJob };
  }, {});

  const workflows = { ...config.workflows };

  if (workflows[workflowName]) {
    const workflow = workflows[workflowName];

    const workflowJob = workflow.jobs.find(j => {
      if (typeof j === 'string') {
        return j === jobName;
      } else {
        const name = Object.keys(j)[0];
        return name === jobName;
      }
    });

    if (workflowJob) {
      const newJobNames = testSuites.map(suite => generateJobName(jobName, suite));
      const jobs = newJobNames.map((newJobName, index) => {
        const requires = getRequiredJob(newJobNames, index, concurrency);
        if (typeof workflowJob === 'string') {
          return newJobName;
        } else {
          return {
            [newJobName]: {
              ...Object.values(workflowJob)[0],
              requires: [...(workflowJob[jobName].requires || []), ...(requires ? [requires] : [])],
            },
          };
        }
      });
      const filteredJobs = replaceWorkflowDependency(removeWorkflowJob(workflow.jobs, jobName), jobName, newJobNames);

      workflow.jobs = [...filteredJobs, ...jobs];
    }
    output.workflows = workflows;
  }
  output.jobs = {
    ...output.jobs,
    ...newJobs,
  };
  return output;
}

/**
 * CircleCI workflow can have multiple jobs. This helper function removes the jobName from the workflow
 * @param jobs - All the jobs in workflow
 * @param jobName - job that needs to be removed from workflow
 */
function removeWorkflowJob(jobs: WorkflowJob[], jobName: string): WorkflowJob[] {
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
 * A job in workflow can require some other job in the workflow to be finished before executing
 * This helper method finds and replaces jobName with jobsToReplacesWith
 * @param jobs - Workflow jobs
 * @param jobName - job to remove from requires
 * @param jobsToReplaceWith - jobs to add to requires
 */
function replaceWorkflowDependency(jobs: WorkflowJob[], jobName: string, jobsToReplaceWith: string[]): WorkflowJob[] {
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

/**
 * Helper function that creates requires block for jobs to limit the concurrency of jobs in circle ci
 * @param jobNames - An array of jobs
 * @param index - current index of the job
 * @param concurrency - number of parallel jobs allowed
 */
function getRequiredJob(jobNames: string[], index: number, concurrency: number = 4): string | void {
  const mod = index % concurrency;
  const mult = Math.floor(index / concurrency);
  if (mult > 0) {
    const prevIndex = (mult - 1) * concurrency + mod;
    return jobNames[prevIndex];
  }
}

function loadConfig(): CircleCIConfig {
  const configFile = join(process.cwd(), '.circleci', 'config.base.yml');
  return yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
}

function saveConfig(config: CircleCIConfig): void {
  const configFile = join(process.cwd(), '.circleci', 'config.yml');
  const output = ['# auto generated file. Edit config.base.yaml if you want to change', yaml.safeDump(config)];
  fs.writeFileSync(configFile, output.join('\n'));
}
function main(): void {
  const config = loadConfig();
  const splitConfig = splitTests(config, 'amplify_e2e_tests', 'build_test_deploy', join(process.cwd(), 'packages', 'amplify-e2e-tests'), 4);
  saveConfig(splitConfig);
}
main();

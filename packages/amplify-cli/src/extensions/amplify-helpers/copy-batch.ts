import { $TSContext, $TSCopyJob, JSONUtilities } from 'amplify-cli-core';

/**
 * Runs a series of jobs through the templating system.
 *
 * @param {$TSContext}          context      - The Amplify CLI context
 * @param {$TSAny[]}            jobs         - A list of jobs to run.
 * @param {$TSAny}              props        - The props to use for variable replacement.
 * @param {boolean}             force        - Force CF template generation
 * @param {$TSAny[]|$TSObject}  writeParams  - boolean of whether props should be written to job.paramsFile, or an object that should be written to job.paramsFile
 */
export async function copyBatch(context: $TSContext, jobs: $TSCopyJob, props: object, force?: boolean, writeParams?: boolean | object) {
  // grab some features
  const { template, prompt, filesystem } = context;
  const { confirm } = prompt;

  // If the file exists
  const shouldGenerate = async (target: string, force?: boolean) => {
    if (!filesystem.exists(target) || force) return true;
    return confirm(`overwrite ${target}`);
  };

  for (const job of jobs) {
    // safety check
    if (!job) {
      continue;
    }

    // generate the React component
    // TODO: Error handling in event of single file write failure
    if (await shouldGenerate(job.target, force)) {
      template.generate({
        directory: job.dir,
        template: job.template,
        target: job.target,
        props,
      });

      if (writeParams && job.paramsFile) {
        const params = writeParams && Object.keys(writeParams) && Object.keys(writeParams).length > 0 ? writeParams : props;

        JSONUtilities.writeJson(job.paramsFile, params);
      }
    }
  }
}

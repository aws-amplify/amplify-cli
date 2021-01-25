import { JSONUtilities, $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';

/**
 * Runs a series of jobs through the templating system.
 *
 * @param {$TSContext}          context      - The Amplify CLI context
 * @param {$TSAny[]}            jobs         - A list of jobs to run.
 * @param {$TSAny}              props        - The props to use for variable replacement.
 * @param {boolean}             force        - Force CF template generation
 * @param {$TSAny[]|$TSObject}  writeParams  - data for the CF template but not parameters file
 */
export async function copyBatch(context: $TSContext, jobs: $TSAny, props: $TSAny, force: boolean, writeParams?: $TSAny[] | $TSObject) {
  // grab some features
  const { template, prompt, filesystem } = context as $TSAny;
  const { confirm } = prompt;

  // If the file exists
  const shouldGenerate = async (target: $TSAny, force: boolean) => {
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

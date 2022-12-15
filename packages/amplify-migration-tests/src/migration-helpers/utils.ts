import { v4 as uuid } from 'uuid';
import {
  cliInputsExists,
  getBackendConfig,
  getCLIInputs,
  getCloudFormationTemplate,
  getParameters,
  parametersExists,
} from '@aws-amplify/amplify-e2e-core';
import * as cfnDiff from '@aws-cdk/cloudformation-diff';
import { Writable } from 'stream';
import { AmplifyCategories } from 'amplify-cli-core';
import strip from 'strip-ansi';

/**
 * generates a random string
 */
export const getShortId = (): string => {
  const [shortId] = uuid().split('-');

  return shortId;
};

/**
 * Asserts that parameters between two project directories didn't drift.
 */
export const assertNoParameterChangesBetweenProjects = (projectRoot1: string, projectRoot2: string): void => {
  const backendConfig1 = getBackendConfig(projectRoot1);
  const backendConfig2 = getBackendConfig(projectRoot2);
  expect(backendConfig2).toMatchObject(backendConfig1);
  for (const categoryKey of Object.keys(backendConfig1)) {
    const category = backendConfig1[categoryKey];
    if (Object.values(AmplifyCategories).includes(categoryKey)) {
      for (const resourceKey of Object.keys(category)) {
        if (cliInputsExists(projectRoot1, categoryKey, resourceKey)) {
          const cliInputs1 = getCLIInputs(projectRoot1, categoryKey, resourceKey);
          const cliInputs2 = getCLIInputs(projectRoot2, categoryKey, resourceKey);
          expect(cliInputs1)
            .toEqual(cliInputs2);
        }
        if (parametersExists(projectRoot1, categoryKey, resourceKey)) {
          const parameters1 = getParameters(projectRoot1, categoryKey, resourceKey);
          const parameters2 = getParameters(projectRoot2, categoryKey, resourceKey);
          expect(parameters1)
            .toEqual(parameters2);
        }
      }
    }
  }
};

class InMemoryWritable extends Writable {
  private _payload = '';

  _write(chunk: any, __encoding: BufferEncoding, callback: (error?: (Error | null)) => void): void {
    if (chunk) {
      this._payload += chunk.toString();
    }
    callback();
  }

  toString(): string {
    return this._payload;
  }
}

/**
 * Collects all differences between cloud formation templates into a single string.
 */
export const collectCloudformationDiffBetweenProjects = (projectRoot1: string, projectRoot2: string): string => {
  const backendConfig1 = getBackendConfig(projectRoot1);
  const backendConfig2 = getBackendConfig(projectRoot2);
  expect(backendConfig2).toMatchObject(backendConfig1);
  const stream = new InMemoryWritable();
  for (const categoryKey of Object.keys(backendConfig1)) {
    const category = backendConfig1[categoryKey];
    for (const resourceKey of Object.keys(category)) {
      const template1 = getCloudFormationTemplate(projectRoot1, categoryKey, resourceKey);
      const template2 = getCloudFormationTemplate(projectRoot2, categoryKey, resourceKey);
      const templateDiff = cfnDiff.diffTemplate(template1, template2);
      if (!templateDiff.isEmpty) {
        cfnDiff.formatDifferences(stream, templateDiff);
      }
    }
  }
  return strip(stream.toString());
};

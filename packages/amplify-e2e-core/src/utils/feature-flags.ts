import _ from 'lodash';
import { pathManager, stateManager, FeatureFlagsEntry, JSONUtilities } from 'amplify-cli-core';

type FeatureFlagData = { features: FeatureFlagsEntry };
const getFeatureFlagFilePath = (projectRoot: string) => {
  return pathManager.getCLIJSONFilePath(projectRoot);
};
export const loadFeatureFlags = (projectRoot: string): FeatureFlagData => {
  const ffPath = getFeatureFlagFilePath(projectRoot);
  return (
    JSONUtilities.readJson<FeatureFlagData>(ffPath, { throwIfNotExist: false, preserveComments: true }) ?? {
      features: {},
    }
  );
};

export const saveFeatureFlagFile = (projectRoot: string, data: FeatureFlagData) => {
  const ffPath = getFeatureFlagFilePath(projectRoot);
  JSONUtilities.writeJson(ffPath, data);
};

/**
 * Set an feature flag
 * @param section Feature flag section
 * @param name feature flag name
 * @param value value for the feature flag
 */
export const addFeatureFlag = (projectRoot: string, section: string, name: string, value: boolean): void => {
  const ff = loadFeatureFlags(projectRoot);
  _.set(ff, ['features', section, name], value);
  saveFeatureFlagFile(projectRoot, ff);
};

import { ResourceTuple } from 'amplify-cli-core';

/**
 * Defines the shape of the mapping stored in `backend-config.json` to map ParameterStore parameters to corresponding project resources
 *
 * If you rename this type, you'll need to update the generate-schemas script in package.json to reference the new name
 */
export type BackendParameters = Record<ParameterName, ParameterConfig>;

type ParameterName = string;

type ParameterConfig = {
  usedBy: ResourceTuple[],
}

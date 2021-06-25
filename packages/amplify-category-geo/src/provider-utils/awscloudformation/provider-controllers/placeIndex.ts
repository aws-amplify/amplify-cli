import { $TSContext, $TSAny, pathManager, JSONUtilities } from 'amplify-cli-core';
import { createPlaceIndexWalkthrough } from '../service-walkthroughs/placeIndexWalkthrough';
import { PlaceIndexParameters } from '../utils/placeIndexParams';
import { PlaceIndexStack } from '../service-stacks/placeIndexStack';
import path from 'path';;
import { category } from '../../../constants';
import { parametersFileName } from '../utils/constants';

export async function addPlaceIndexResource(context: $TSContext) {
  let addParameters: Partial<PlaceIndexParameters> = {};
  addParameters = await createPlaceIndexWalkthrough(context);
  let parameters: PlaceIndexParameters = addParameters as PlaceIndexParameters;
  generateCfnFile(parameters);
  saveCfnParameters(parameters);
  updateAmplifyMeta(context, parameters)
  const { print } = context;
  print.success(`Successfully added resource ${parameters.indexName} locally.`);
  print.info('');
  print.success('Next steps:');
  print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
  print.info(
    '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
  );
  return '';
}

export function updatePlaceIndexResource() {
  //TODO
}

export function removePlaceIndexResource() {
  //TODO
}

function generateCfnFile(parameters: PlaceIndexParameters) {
  const placeIndexStack = new PlaceIndexStack(undefined, 'PlaceIndexStack', parameters);
  const cfnFileName = (resourceName: string) => `${resourceName}-cloudformation-template.json`;
  const resourceDir = path.join(pathManager.getBackendDirPath(), category, parameters.indexName);
  JSONUtilities.writeJson(path.normalize(path.join(resourceDir, cfnFileName(parameters.indexName))), placeIndexStack.toCloudFormation());
}

function saveCfnParameters(parameters: PlaceIndexParameters) {
  const params = {
    authRoleName: {
      "Ref": "AuthRoleName"
    },
    unauthRoleName: {
      "Ref": "UnauthRoleName"
    }
  };
  const parametersFilePath = path.join(pathManager.getBackendDirPath(), category, parameters.indexName, parametersFileName);
  const currentParameters: $TSAny = JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || {};
  JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });

}

function updateAmplifyMeta(context: $TSContext, parameters: PlaceIndexParameters) {
  
  context.amplify.updateamplifyMetaAfterResourceAdd(
    category,
    parameters.indexName,
    parameters,
  );
}
import { $TSContext } from 'amplify-cli-core';
import { createPlaceIndexWalkthrough } from '../service-walkthroughs/placeIndexWalkthrough';
import { PlaceIndexParameters } from '../utils/placeIndexParams';

export async function addPlaceIndexResource(context: $TSContext) {
  let parameters: Partial<PlaceIndexParameters> = {};
  parameters = await createPlaceIndexWalkthrough(context);
  createPlaceIndexResource();
  return '';
}

export function updatePlaceIndexResource() {
  //TODO
}

export function removePlaceIndexResource() {
  //TODO
}

export function createPlaceIndexResource() {
  //TODO
}
import * as path from 'path';

export const apiDocs = {
  mapStyles: "https://docs.aws.amazon.com/location-maps/latest/APIReference/API_MapConfiguration.html",
  pricingPlan: "https://aws.amazon.com/location/pricing/",
  dataSourceUsage: "https://docs.aws.amazon.com/location-places/latest/APIReference/API_DataSourceConfiguration.html"
}

export const previewBanner = 'Amplify Geo category is in developer preview and not intended for production use at this time.';
export const chooseServiceMessageAdd = 'Select which capability you want to add:';
export const chooseServiceMessageUpdate = 'Select which capability you want to update:';
export const chooseServiceMessageRemove = 'Select which capability you want to remove:';
export const choosePricingPlan = `The following choices determine the pricing plan for Geo resources. Learn more at ${apiDocs.pricingPlan}`;
export const parametersFileName = 'parameters.json';
export const provider = 'awscloudformation';
export const customMapLambdaCodePath = path.join(__dirname, '../../resources/custom-map-resource-handler.js');
export const customPlaceIndexLambdaCodePath = path.join(__dirname, '../../resources/custom-place-index-resource-handler.js');

export enum ServiceName {
  Map = 'Map',
  PlaceIndex = 'PlaceIndex',
  GeofenceCollection = 'GeofenceCollection',
  Tracker = 'Tracker'
}

import * as path from 'path';

export const serviceMetadataFor = async (service: string) =>
  (await import(path.join('..', '..', 'supported-services'))).supportedServices[service];

export const datasourceMetadataFor = async (datasource: string) =>
  (await import(path.join('..', '..', 'supported-datasources'))).supportedDatasources[datasource];

export const getServiceWalkthrough = async (walkthroughFilename: string) =>
  (await import(path.join('..', 'service-walkthroughs', walkthroughFilename))).serviceWalkthrough;

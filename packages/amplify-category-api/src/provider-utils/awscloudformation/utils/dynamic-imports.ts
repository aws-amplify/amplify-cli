export const serviceMetadataFor = async service => (await import('../../supported-services')).supportedServices[service];
export const datasourceMetadataFor = async datasource => (await import('../../supported-datasources')).supportedDatasources[datasource];
export const getServiceWalkthrough = async walkthroughFilename =>
  (await import(`../service-walkthroughs/${walkthroughFilename}`)).serviceWalkthrough;

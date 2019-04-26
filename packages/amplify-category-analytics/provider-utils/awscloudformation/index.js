
function addResource(context, category, service) {
  const serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;

  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { addWalkthrough } = require(serviceWalkthroughSrc);

  return addWalkthrough(context, defaultValuesFilename, serviceMetadata);
}

module.exports = { addResource };

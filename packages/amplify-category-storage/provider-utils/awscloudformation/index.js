const fs = require('fs');

function addResource(context, category, service, options) {
  const serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { addWalkthrough } = require(serviceWalkthroughSrc);

  return addWalkthrough(context, defaultValuesFilename, serviceMetadata)
    .then(async (resourceName) => {
      context.amplify.updateamplifyMetaAfterResourceAdd(
        category,
        resourceName,
        options,
      );
      return resourceName;
    });
}

function updateResource(context, category, service) {
  const serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  return updateWalkthrough(context, defaultValuesFilename, serviceMetadata);
}


module.exports = { addResource, updateResource };

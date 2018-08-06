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

function updateResource(context) {
  context.print.warning('You can only add or remove a storage resource.');
  process.exit(0);
}


module.exports = { addResource, updateResource };

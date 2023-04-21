const response = require('cfn-response');
const {
  LocationClient,
  CreateGeofenceCollectionCommand,
  DeleteGeofenceCollectionCommand,
  UpdateGeofenceCollectionCommand,
} = require('@aws-sdk/client-location');
exports.handler = async function (event, context) {
  try {
    console.log('REQUEST RECEIVED:' + JSON.stringify(event));
    const pricingPlan = 'RequestBasedUsage';
    if (event.RequestType === 'Create') {
      const params = {
        CollectionName: event.ResourceProperties.collectionName,
        PricingPlan: pricingPlan,
      };
      const locationClient = new LocationClient({ region: event.ResourceProperties.region });
      const res = await locationClient.send(new CreateGeofenceCollectionCommand(params));
      console.log('create resource response data' + JSON.stringify(res));
      if (res.CollectionName && res.CollectionArn) {
        await response.send(event, context, response.SUCCESS, res, params.CollectionName);
      } else {
        await response.send(event, context, response.FAILED, res, params.CollectionName);
      }
    }
    if (event.RequestType === 'Update') {
      const params = {
        CollectionName: event.ResourceProperties.collectionName,
        PricingPlan: pricingPlan,
      };
      const locationClient = new LocationClient({ region: event.ResourceProperties.region });
      const res = await locationClient.send(new UpdateGeofenceCollectionCommand(params));
      console.log('update resource response data' + JSON.stringify(res));
      if (res.CollectionName) {
        await response.send(event, context, response.SUCCESS, res, params.CollectionName);
      } else {
        await response.send(event, context, response.FAILED, res, params.CollectionName);
      }
    }
    if (event.RequestType === 'Delete') {
      const params = {
        CollectionName: event.ResourceProperties.collectionName,
      };
      const locationClient = new LocationClient({ region: event.ResourceProperties.region });
      const res = await locationClient.send(new DeleteGeofenceCollectionCommand(params));
      console.log('delete resource response data' + JSON.stringify(res));
      await response.send(event, context, response.SUCCESS, res, params.CollectionName);
    }
  } catch (err) {
    console.log(err.stack);
    const res = { Error: err };
    await response.send(event, context, response.FAILED, res, event.ResourceProperties.collectionName);
    throw err;
  }
};

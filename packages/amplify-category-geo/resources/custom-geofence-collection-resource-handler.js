const response = require('cfn-response');
const aws = require('aws-sdk');
exports.handler = async function (event, context) {
  try {
    console.log('REQUEST RECEIVED:' + JSON.stringify(event));
    if (event.RequestType == 'Create') {
      const params = {
        CollectionName: event.ResourceProperties.collectionName,
        PricingPlan: 'RequestBasedUsage'
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.createGeofenceCollection(params).promise();
      console.log('create resource response data' + JSON.stringify(res));
      if (res.CollectionName && res.CollectionArn) {
        await response.send(event, context, response.SUCCESS, res, params.CollectionName);
      } else {
        await response.send(event, context, response.FAILED, res, params.CollectionName);
      }
    }
    if (event.RequestType == 'Update') {
      const params = {
        CollectionName: event.ResourceProperties.collectionName,
        PricingPlan: 'RequestBasedUsage'
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.updateGeofenceCollection(params).promise();
      console.log('update resource response data' + JSON.stringify(res));
      if (res.CollectionName) {
        await response.send(event, context, response.SUCCESS, res, params.CollectionName);
      } else {
        await response.send(event, context, response.FAILED, res, params.CollectionName);
      }
    }
    if (event.RequestType == 'Delete') {
      const params = {
        CollectionName: event.ResourceProperties.collectionName
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.deleteGeofenceCollection(params).promise();
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

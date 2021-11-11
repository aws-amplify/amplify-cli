const response = require('cfn-response');
const aws = require('aws-sdk');
exports.handler = async (event, context) => {
  try {
    console.log('REQUEST RECEIVED:' + JSON.stringify(event));
    if (event.RequestType == 'Create') {
      const params = {
        CollectionName: event.ResourceProperties.collectionName,
        PricingPlan: event.ResourceProperties.pricingPlan
      };
      if (params.PricingPlan !== 'RequestBasedUsage') {
        params['PricingPlanDataSource'] = event.ResourceProperties.dataSource;
      }
      event.PhysicalResourceId = params.CollectionName;
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.createGeofenceCollection(params).promise();
      console.log('create resource response data' + JSON.stringify(res));
      if (res.CollectionName && res.CollectionArn) {
        await send(event, context, response.SUCCESS, res);
      } else {
        await send(event, context, response.FAILED, res);
      }
    }
    if (event.RequestType == 'Update') {
      const params = {
        CollectionName: event.ResourceProperties.collectionName,
        PricingPlan: event.ResourceProperties.pricingPlan
      };
      if (params.PricingPlan !== 'RequestBasedUsage') {
        params['PricingPlanDataSource'] = event.ResourceProperties.dataSource;
      }
      event.PhysicalResourceId = params.CollectionName;
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.updateGeofenceCollection(params).promise();
      console.log('update resource response data' + JSON.stringify(res));
      if (res.CollectionName) {
        await send(event, context, response.SUCCESS, res);
      } else {
        await send(event, context, response.FAILED, res);
      }
    }
    if (event.RequestType == 'Delete') {
      const params = {
        CollectionName: event.ResourceProperties.collectionName
      };
      event.PhysicalResourceId = params.CollectionName;
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.deleteGeofenceCollection(params).promise();
      console.log('delete resource response data' + JSON.stringify(res));
      await send(event, context, response.SUCCESS, res);
    }
  } catch (err) {
    console.log(err.stack);
    const res = { Error: err };
    await send(event, context, response.FAILED, res);
    throw err;
  }
};

function send(event, context, status, data) {
  return new Promise(() => {
    response.send(event, context, status, data);
  });
}

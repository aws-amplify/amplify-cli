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
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.createGeofenceCollection(params).promise();
      console.log('create resource response data' + JSON.stringify(res));
      if (res.CollectionName && res.CollectionArn) {
        event.PhysicalResourceId = res.CollectionName;
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
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.updateGeofenceCollection(params).promise();
      console.log('update resource response data' + JSON.stringify(res));
      if (res.CollectionName && res.CollectionArn) {
        event.PhysicalResourceId = res.CollectionName;
        await send(event, context, response.SUCCESS, res);
      } else {
        await send(event, context, response.FAILED, res);
      }
    }
    if (event.RequestType == 'Delete') {
      const params = {
        CollectionName: event.ResourceProperties.collectionName
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.deleteGeofenceCollection(params).promise();
      event.PhysicalResourceId = event.ResourceProperties.CollectionName;
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

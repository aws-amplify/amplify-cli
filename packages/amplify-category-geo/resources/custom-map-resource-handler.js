const response = require('cfn-response');
const aws = require('aws-sdk');
exports.handler = async function (event, context) {
  try {
    console.log('REQUEST RECEIVED:' + JSON.stringify(event));
    const pricingPlan = 'RequestBasedUsage';
    if (event.RequestType == 'Create') {
      let params = {
        MapName: event.ResourceProperties.mapName,
        Configuration: {
          Style: event.ResourceProperties.mapStyle,
        },
        PricingPlan: pricingPlan
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.createMap(params).promise();
      console.log('create resource response data' + JSON.stringify(res));
      if (res.MapName && res.MapArn) {
        await response.send(event, context, response.SUCCESS, res, params.MapName);
      } else {
        await response.send(event, context, response.FAILED, res, params.MapName);
      }
    }
    if (event.RequestType == 'Update') {
      let params = {
        MapName: event.ResourceProperties.mapName,
        PricingPlan: pricingPlan
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.updateMap(params).promise();
      console.log('update resource response data' + JSON.stringify(res));
      if (res.MapName && res.MapArn) {
        await response.send(event, context, response.SUCCESS, res, params.MapName);
      } else {
        await response.send(event, context, response.FAILED, res, params.MapName);
      }
    }
    if (event.RequestType == 'Delete') {
      let params = {
        MapName: event.ResourceProperties.mapName
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.deleteMap(params).promise();
      console.log('delete resource response data' + JSON.stringify(res));
      await response.send(event, context, response.SUCCESS, res, params.MapName);
    }
  } catch (err) {
    console.log(err.stack);
    const res = { Error: err };
    await response.send(event, context, response.FAILED, res, event.ResourceProperties.mapName);
    throw err;
  }
};

const response = require('cfn-response');
const aws = require('aws-sdk');
exports.handler = async (event, context) => {
 try {
  console.log('REQUEST RECEIVED:' + JSON.stringify(event));
  if (event.RequestType == 'Create') {
    let params = {
      MapName: event.ResourceProperties.mapName,
      Configuration: {
        Style: event.ResourceProperties.mapStyle
      },
      PricingPlan: event.ResourceProperties.pricingPlan
    };
    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
    const res = await locationClient.createMap(params).promise();
    console.log("create resource response data" + JSON.stringify(res));
    if (res.MapName && res.MapArn) {
        event.PhysicalResourceId = res.MapName;
        await send(event, context, response.SUCCESS, res);
    }
    else {
        await send(event, context, response.FAILED, res);
    }
  }
  if (event.RequestType == 'Update') {
    let params = {
      MapName: event.ResourceProperties.mapName,
      PricingPlan: event.ResourceProperties.pricingPlan
    };
    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
    const res = await locationClient.updateMap(params).promise();
    console.log("update resource response data" + JSON.stringify(res));
    if (res.MapName && res.MapArn) {
        event.PhysicalResourceId = res.MapName;
        await send(event, context, response.SUCCESS, res);
    }
    else {
        await send(event, context, response.FAILED, res);
    }
  }
  if (event.RequestType == 'Delete') {
    let params = {
      MapName: event.ResourceProperties.mapName
    };
    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
    const res = await locationClient.deleteMap(params).promise();
    event.PhysicalResourceId = event.ResourceProperties.mapName;
    console.log("delete resource response data" + JSON.stringify(res));
    await send(event, context, response.SUCCESS, res);
  }
 } catch(err) {
  console.log(err.stack);
  const res = {Error: err};
  await send(event, context, response.FAILED, res);
  throw err;
 }
};

function send(event, context, status, data) {
    return new Promise(() => { response.send(event, context, status, data) });
}

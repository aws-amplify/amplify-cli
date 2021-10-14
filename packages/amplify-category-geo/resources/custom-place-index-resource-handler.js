const response = require('cfn-response');
const aws = require('aws-sdk');
exports.handler = async (event, context) => {
 try {
  console.log('REQUEST RECEIVED:' + JSON.stringify(event));
  if (event.RequestType == 'Create') {
    const params = {
      IndexName: event.ResourceProperties.indexName,
      DataSource: event.ResourceProperties.dataSource,
      PricingPlan: event.ResourceProperties.pricingPlan,
      DataSourceConfiguration: {
        IntendedUse: event.ResourceProperties.dataSourceIntendedUse
      }
    };
    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
    const res = await locationClient.createPlaceIndex(params).promise();
    console.log("create resource response data" + JSON.stringify(res));
    if (res.IndexName && res.IndexArn) {
        event.PhysicalResourceId = res.IndexName;
        await send(event, context, response.SUCCESS, res);
    }
    else {
        await send(event, context, response.FAILED, res);
    }
  }
  if (event.RequestType == 'Update') {
    const params = {
      IndexName: event.ResourceProperties.indexName,
      PricingPlan: event.ResourceProperties.pricingPlan,
      DataSourceConfiguration: {
        IntendedUse: event.ResourceProperties.dataSourceIntendedUse
      }
    };
    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
    const res = await locationClient.updatePlaceIndex(params).promise();
    console.log("update resource response data" + JSON.stringify(res));
    if (res.IndexName && res.IndexArn) {
        event.PhysicalResourceId = res.IndexName;
        await send(event, context, response.SUCCESS, res);
    }
    else {
        await send(event, context, response.FAILED, res);
    }
  }
  if (event.RequestType == 'Delete') {
    const params = {
      IndexName: event.ResourceProperties.indexName
    };
    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
    const res = await locationClient.deletePlaceIndex(params).promise();
    event.PhysicalResourceId = event.ResourceProperties.indexName;
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

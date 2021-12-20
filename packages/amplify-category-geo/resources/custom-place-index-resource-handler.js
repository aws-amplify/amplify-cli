const response = require('cfn-response');
const aws = require('aws-sdk');
exports.handler = async function (event, context) {
  try {
    console.log('REQUEST RECEIVED:' + JSON.stringify(event));
    if (event.RequestType == 'Create') {
      const params = {
        IndexName: event.ResourceProperties.indexName,
        DataSource: event.ResourceProperties.dataSource,
        DataSourceConfiguration: {
          IntendedUse: event.ResourceProperties.dataSourceIntendedUse,
        },
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.createPlaceIndex(params).promise();
      console.log('create resource response data' + JSON.stringify(res));
      if (res.IndexName && res.IndexArn) {
        event.PhysicalResourceId = res.IndexName;
        await response.send(event, context, response.SUCCESS, res, params.IndexName);
      } else {
        await response.send(event, context, response.FAILED, res, params.IndexName);
      }
    }
    if (event.RequestType == 'Update') {
      const params = {
        IndexName: event.ResourceProperties.indexName,
        DataSourceConfiguration: {
          IntendedUse: event.ResourceProperties.dataSourceIntendedUse,
        },
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.updatePlaceIndex(params).promise();
      console.log('update resource response data' + JSON.stringify(res));
      if (res.IndexName && res.IndexArn) {
        event.PhysicalResourceId = res.IndexName;
        await response.send(event, context, response.SUCCESS, res, params.IndexName);
      } else {
        await response.send(event, context, response.FAILED, res, params.IndexName);
      }
    }
    if (event.RequestType == 'Delete') {
      const params = {
        IndexName: event.ResourceProperties.indexName,
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.deletePlaceIndex(params).promise();
      event.PhysicalResourceId = event.ResourceProperties.indexName;
      console.log('delete resource response data' + JSON.stringify(res));
      await response.send(event, context, response.SUCCESS, res, params.IndexName);
    }
  } catch (err) {
    console.log(err.stack);
    const res = { Error: err };
    await response.send(event, context, response.FAILED, res, event.ResourceProperties.indexName);
    throw err;
  }
};

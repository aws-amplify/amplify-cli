const response = require('cfn-response');
const aws = require('aws-sdk');

/**
 * trackingResourceHandler
 */
const trackingResourceHandler = async (event, context) => {
  try {
    console.log(`REQUEST RECEIVED: ${JSON.stringify(event)}`);
    const pricingPlan = 'RequestBasedUsage';
    if (event.RequestType === 'Create') {
      const params = {
        TrackerName: event.ResourceProperties.trackerName,
        PricingPlan: pricingPlan,
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });
      const res = await locationClient.createTracker(params).promise();
      console.log(`create resource response data ${JSON.stringify(res)}`);
      if (res.TrackerName && res.TrackerArn) {
        await response.send(event, context, response.SUCCESS, res, params.TrackerName);
      } else {
        await response.send(event, context, response.FAILED, res, params.TrackerName);
      }
    }
  } catch (err) {
    console.log(err.stack);
    const res = { Error: err };
    await response.send(event, context, response.FAILED, res, event.ResourceProperties.trackerName);
    throw err;
  }
};

exports.handler = trackingResourceHandler;

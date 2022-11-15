const response = require('cfn-response');
const aws = require('aws-sdk');

/**
 * trackingResourceHandler
 */
const trackingResourceHandler = async (event, context) => {
  console.log(`REQUEST RECEIVED: ${JSON.stringify(event)}`);
  const pricingPlan = 'RequestBasedUsage';
  const {
    trackerName, positionFiltering, linkedGeofenceCollectionArns, region,
  } = event.ResourceProperties;
  try {
    if (event.RequestType === 'Create') {
      const params = {
        TrackerName: trackerName,
        PricingPlan: pricingPlan,
        PositionFiltering: positionFiltering,
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region });
      const res = await locationClient.createTracker(params).promise();
      console.log(`create resource response data ${JSON.stringify(res)}`);
      if (res.TrackerName && res.TrackerArn) {
        linkedGeofenceCollectionArns.forEach(async geofenceCollectionArn => {
          await locationClient.associateTrackerConsumer({ TrackerName: trackerName, ConsumerArn: geofenceCollectionArn }).promise();
        });
        await response.send(event, context, response.SUCCESS, res, params.TrackerName);
      } else {
        await response.send(event, context, response.FAILED, res, params.TrackerName);
      }
    }
    if (event.RequestType === 'Update') {
      const params = {
        TrackerName: trackerName,
        PricingPlan: pricingPlan,
        PositionFiltering: positionFiltering,
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region });
      const currentTrackerConsumers = await locationClient.listTrackerConsumers({ TrackerName: trackerName }).promise();
      // remove existing trackerConsumers if they are de-selected when updating tracker
      currentTrackerConsumers.ConsumerArns.forEach(async consumerArn => {
        if (linkedGeofenceCollectionArns.indexOf(consumerArn) < 0) {
          await locationClient.disassociateTrackerConsumer({ TrackerName: trackerName, ConsumerArn: consumerArn }).promise();
        }
      });
      const res = await locationClient.updateTracker(params).promise();
      console.log(`update resource response data${JSON.stringify(res)}`);
      if (res.TrackerName && res.TrackerArn) {
        linkedGeofenceCollectionArns.forEach(async geofenceCollectionArn => {
          // create trackerConsumer resources only if not already available
          if (currentTrackerConsumers.ConsumerArns.indexOf(geofenceCollectionArn) < 0) {
            await locationClient.associateTrackerConsumer({ TrackerName: trackerName, ConsumerArn: geofenceCollectionArn }).promise();
          }
        });
        await response.send(event, context, response.SUCCESS, res, params.TrackerName);
      } else {
        await response.send(event, context, response.FAILED, res, params.TrackerName);
      }
    }
    if (event.RequestType === 'Delete') {
      const params = {
        TrackerName: trackerName,
      };
      const locationClient = new aws.Location({ apiVersion: '2020-11-19', region });
      const currentTrackerConsumers = await locationClient.listTrackerConsumers({ TrackerName: trackerName }).promise();
      currentTrackerConsumers.ConsumerArns.forEach(async consumerArn => {
        await locationClient.disassociateTrackerConsumer({ TrackerName: trackerName, ConsumerArn: consumerArn }).promise();
      });
      const res = await locationClient.deleteTracker(params).promise();
      console.log(`delete resource response data${JSON.stringify(res)}`);
      await response.send(event, context, response.SUCCESS, res, params.TrackerName);
    }
  } catch (err) {
    console.log(err.stack);
    const res = { Error: err };
    await response.send(event, context, response.FAILED, res, trackerName);
    throw err;
  }
};

exports.handler = trackingResourceHandler;

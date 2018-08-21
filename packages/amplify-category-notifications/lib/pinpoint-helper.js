const constants = require('./constants'); 

await function ensurePinpointApp(context){
  const { amplifyMeta, projectConfig } = context.exeInfo;
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.CategoryName]);
  if(!pinpointApp){
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.AnalyticsCategoryName]);
    if(pinpointApp){
      if(!pinpointApp.Name){
        pinpointApp = await getPinpointApp(context, pinpointApp.Id);
      }
    }else{
      pinpointApp = await createPinpointApp(context, projectConfig.projectName); 
    }
    amplifyMeta[constants.CategoryName][pinpointApp.Name] = {
      "service": constants.PinpointName,
      "output": {
        "Name": pinpointApp.Name,
        "Id": pinpointApp.Id
      }
    }
  }
}

function scanCategoryMetaForPinpoint(categoryMeta){
  let result; 
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (let i = 0; i < services.length; i++) {
      const serviceMeta = analyticsMeta[services[i]]; 
      if (serviceMeta.service === 'Pinpoint' && 
        serviceMeta.output && 
        serviceMeta.output.Id){
        result = {
          Id: serviceMeta.output.Id
        }
        if(serviceMeta.output.Name){
          result.Name = serviceMeta.output.Name;
        }else if(serviceMeta.output.appName){
          result.Name = serviceMeta.output.appName;
        }
        break;
      }
    }
  }
  return result; 
}
 
function createPinpointApp(context, pinpointAppName){
  const params = {
    CreateApplicationRequest: {
      Name: pinpointAppName
    }
  };
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.createApp(params, (err, data) => {
      if (err) {
        context.print.error('Pinpoint app creation error');
        reject(err);
      } else {
        context.print.success('Successfully created Pinpoint app: ' + data.ApplicationResponse.Name);
        resolve(data.ApplicationResponse);
      }
    });
  });
} 

function getPinpointApp(context, pinpointAppId){
  const params = {
      ApplicationId: pinpointAppId
  };
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.getApp(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.ApplicationResponse);
      }
    });
  });
}

module.exports = {
  ensurePinpointApp
};

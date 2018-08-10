const inquirer = require('inquirer');
const platform = "SMS";

async function run(context) {
    await enableChannel(context);
    await disableChannel(context); 
    return context;
}


function enableChannel(context){
    const params = {
      ApplicationId: context.exeInfo.serviceMeta.output.Id,
      SMSChannelRequest: {
        Enabled: true
      }
    };
  
    console.log('update channel');
    console.log(params);
  
    return new Promise((resolve, reject)=>{
      context.exeInfo.pinpointClient.updateSmsChannel(params, (err, data)=>{
        if(err){
          console.log('update channel error');
          reject(err); 
        }else{
          console.log('update channel success, enabled');
          console.log(data); 
          context.exeInfo.serviceMeta.output[platform] = {
              enabled: true
          }
          resolve(data); 
        }
      });
    })
}

function disableChannel(context){
    const params = {
      ApplicationId: context.exeInfo.serviceMeta.output.Id,
      SMSChannelRequest: {
        Enabled: false
      }
    };
  
    console.log('update channel');
    console.log(params);
  
    return new Promise((resolve, reject)=>{
      context.exeInfo.pinpointClient.updateSmsChannel(params, (err, data)=>{
        if(err){
          console.log('update channel error');
          reject(err); 
        }else{
          console.log('update channel success, disabled');
          console.log(data); 
          context.exeInfo.serviceMeta.output[platform] = {
              enabled: false
          }
          resolve(data); 
        }
      });
    })
}
  

module.exports = {
  run,
};

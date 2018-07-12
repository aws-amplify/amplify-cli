const builder = require('./builder'); 

function run(context) {
  if(amplifyMeta.hosting){
    return builder.run(context)
    .then(publishToHostingBucket)
    .then(onSuccess)
    .catch(onFailure); 
  }else{
    throw new Error('Hosting is not enabled');
  }
}

function publishToHostingBucket(context){
  return context;
}

function onSuccess(context){
  return context;
}

function onFailure(e){
  throw e; 
}

module.exports = {
  run
};

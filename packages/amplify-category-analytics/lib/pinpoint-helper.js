const category = 'analytics';

function checkPinpointEnabledAndPushed(context) {
  let result = false;
  const { amplifyMeta } = context.exeInfo;
  if (amplifyMeta[category]) {
    const services = Object.keys(amplifyMeta[category]);

    for (let i = 0; i < services.length; i++) {
      if (amplifyMeta[category][services[i]].service === 'Pinpoint' && 
        amplifyMeta[category][services[i]].output && 
        amplifyMeta[category][services[i]].output.Id){
        result = true;
        context.exeInfo.serviceMeta = amplifyMeta[category][services[i]];
        break;
      }
    }
  }
  return result;
}

module.exports = {
  checkPinpointEnabledAndPushed,
};

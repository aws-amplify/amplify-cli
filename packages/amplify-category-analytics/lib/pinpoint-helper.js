const category = 'analytics';

function checkPinpointEnabled(context) {
    let result = false;
    const { amplifyMeta } = context.exeInfo;
    if (amplifyMeta[category]) {
      const services = Object.keys(amplifyMeta[category]);
  
      for (let i = 0; i < services.length; i++) {
        if (amplifyMeta[category][services[i]].service === 'Pinpoint') {
          result = true;
          context.exeInfo.serviceMeta = amplifyMeta[category][services[i]];
          break;
        }
      }
    }
    return result;
}

module.exports = {
    checkPinpointEnabled
}

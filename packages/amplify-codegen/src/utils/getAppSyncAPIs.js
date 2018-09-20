function getAppSyncAPIs(allAPIs = {}) {
  const appSyncAPIs = Object.keys(allAPIs).reduce((acc, apiName) => {
    const api = allAPIs[apiName];
    if (api.service === 'AppSync') {
      acc.push({ ...api, name: apiName });
    }
    return acc;
  }, []);
  return appSyncAPIs;
}

module.exports = getAppSyncAPIs;

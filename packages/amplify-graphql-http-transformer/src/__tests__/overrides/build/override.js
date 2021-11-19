function override(resource) {
  resource.http.httpsDataSource['httpwwwapicom'].serviceRoleArn = 'mockArn';
  resource.http.httpsDataSource['httpwwwapicom'].httpConfig = {
    endpoint: 'mockEndpoint',
  };
  resource.http.httpsDataSource['httpapicom'].serviceRoleArn = 'mockArn';
  resource.http.httpsDataSource['httpapicom'].httpConfig = {
    endpoint: 'mockEndpoint',
  };
  resource.http.httpsDataSource['httpwwwgooglecom'].serviceRoleArn = 'mockArn';
  resource.http.httpsDataSource['httpwwwgooglecom'].httpConfig = {
    endpoint: 'mockEndpoint',
  };
  resource.http.httpsDataSource['httpswwwapicom'].serviceRoleArn = 'mockArn';
  resource.http.httpsDataSource['httpswwwapicom'].httpConfig = {
    endpoint: 'mockEndpoint',
  };
  // override resolver
  resource.http.resolvers['commentContentResolver'].requestMappingTemplate = 'mockTemplate';
}
exports.override = override;

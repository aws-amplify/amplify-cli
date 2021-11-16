function override(resource) {
  /* TODO: Add snippet of how to override in comments */
  resource.function.lambdaDataSource['Echofunction'].serviceRoleArn = 'mockArn';
  resource.function.lambdaDataSource['Otherfunction'].serviceRoleArn = 'mockArn';
  // override resolver
  resource.function.resolvers['queryEchoResolver'].requestMappingTemplate = 'mockTemplate';
}
exports.override = override;

function override(resource) {
  resource.opensearch.OpenSearchDomain.encryptionAtRestOptions = {
    enabled: true,
    kmsKeyId: '1a2a3a4-1a2a-3a4a-5a6a-1a2a3a4a5a6a',
  };
  resource.opensearch.OpenSearchDataSource.serviceRoleArn = 'mockArn';
  resource.opensearch.OpenSearchModelLambdaMapping['Post'].functionName = 'mockFunciton';
  // override resolver
  resource.opensearch.resolvers['querySearchPostsResolver'].requestMappingTemplate = 'mockTemplate';
}
exports.override = override;

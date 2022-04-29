function override(resource) {
  resource.api.GraphQLAPI.xrayEnabled = true;
  resource.models['Post'].modelDDBTable.billingMode = 'PROVISIONED';
  resource.models['Comment'].modelDDBTable.billingMode = 'PROVISIONED';
  // override resolver
  resource.models['Post'].resolvers['subscriptionOnUpdatePostResolver'].requestMappingTemplate = 'mockTemplate';
}
exports.override = override;

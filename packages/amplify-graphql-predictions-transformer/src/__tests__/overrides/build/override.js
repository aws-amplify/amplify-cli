function override(resource) {
  /* TODO: Add snippet of how to override in comments */
  resource.predictions.TranslateDataSource.serviceRoleArn = 'mockArn';
  resource.predictions.resolvers['querySpeakTranslatedLabelTextResolver'].requestMappingTemplate = 'mockTeplate';
}
exports.override = override;

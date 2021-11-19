function override(resource) {
  resource.predictions.TranslateDataSource.serviceRoleArn = 'mockArn';
  resource.predictions.resolvers['querySpeakTranslatedLabelTextResolver'].requestMappingTemplate = 'mockTeplate';
}
exports.override = override;
